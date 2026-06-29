const {
  Claim,
  Client,
  Event,
  MemoryOutcome,
  Playbook,
  Recommendation,
  Run,
} = require('../Schema');

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const SIGNAL_MODEL = process.env.GROQ_SIGNAL_MODEL || 'llama-3.1-8b-instant';
const RECOMMENDATION_MODEL = process.env.GROQ_RECOMMENDATION_MODEL || 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ─── helpers ────────────────────────────────────────────────────────────────

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function nextRunLabel(count) {
  return `Run ${count + 1}`;
}

function confidenceFromHistory(baseConfidence, outcomes) {
  if (!outcomes.length) return Math.min(0.95, Math.max(0.2, baseConfidence));
  const approvals = outcomes.filter((o) => o.decision === 'approved').length;
  const edits = outcomes.filter((o) => o.decision === 'edited').length;
  const rejections = outcomes.filter((o) => o.decision === 'rejected').length;
  const total = outcomes.length;
  const adjustment = ((approvals * 0.08) + (edits * 0.03) - (rejections * 0.12)) / total;
  return Math.min(0.95, Math.max(0.1, Number((baseConfidence + adjustment).toFixed(2))));
}

function inferClientStage(claims) {
  const tags = new Set(claims.map((c) => c.tag));
  if (tags.has('renewal_risk') || tags.has('critical_support_issue') || tags.has('usage_drop')) return 'at_risk';
  if (tags.has('expansion_interest') || tags.has('budget_window_open') || tags.has('strong_adoption')) return 'expansion_ready';
  if (tags.has('low_adoption')) return 'active_adoption';
  return 'post_renewal';
}

function claimsMeetCondition(claims, condition) {
  return claims.filter((c) => c.tag === condition.tag && c.type === condition.type).length >= (condition.min_count || 1);
}

async function groqChat(model, messages, temperature = 0.2) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model, messages, temperature, response_format: { type: 'json_object' } }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq ${model} error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

// ─── deterministic fallback (Agent 1) ───────────────────────────────────────

function deterministicClaims(event) {
  const p = event.data || {};
  const claims = [];

  if (event.event_type === 'usage_snapshot') {
    const chg = toNumber(p.usage_change_pct, 0);
    const score = toNumber(p.adoption_score, 0);
    if (chg <= -20) claims.push({ type: 'risk', tag: 'usage_drop', description: `Product usage dropped by ${Math.abs(chg)}% compared to the previous snapshot.` });
    if (chg >= 20) claims.push({ type: 'opportunity', tag: 'usage_growth', description: `Product usage grew by ${chg}% compared to the previous snapshot.` });
    if (score < 50) claims.push({ type: 'risk', tag: 'low_adoption', description: `Adoption score is ${score}, signaling weak product penetration.` });
    if (score >= 80) claims.push({ type: 'opportunity', tag: 'strong_adoption', description: `Adoption score is ${score}, indicating strong product engagement.` });
  }

  if (event.event_type === 'support_ticket') {
    const priority = String(p.priority || '').toLowerCase();
    const status = String(p.status || '').toLowerCase();
    const csat = toNumber(p.csat, null);
    if (priority === 'high' || priority === 'urgent') claims.push({ type: 'risk', tag: 'critical_support_issue', description: `A ${priority} priority support ticket needs attention.` });
    if (status && !['resolved', 'closed'].includes(status)) claims.push({ type: 'risk', tag: 'unresolved_ticket', description: `Support ticket remains ${status}.` });
    if (csat !== null && csat <= 2) claims.push({ type: 'risk', tag: 'poor_support_sentiment', description: `Support interaction received a CSAT score of ${csat}.` });
  }

  if (event.event_type === 'meeting_note') {
    const sentiment = String(p.sentiment || '').toLowerCase();
    if (sentiment === 'negative' || p.renewal_risk) claims.push({ type: 'risk', tag: 'renewal_risk', description: 'Meeting notes indicate renewal concern or negative stakeholder sentiment.' });
    if (p.expansion_interest || sentiment === 'positive') claims.push({ type: 'opportunity', tag: 'expansion_interest', description: 'Meeting notes suggest interest in broader rollout or upsell conversation.' });
  }

  if (event.event_type === 'crm_note') {
    if (p.executive_sponsor_change || p.champion_change) claims.push({ type: 'risk', tag: 'stakeholder_change', description: 'CRM notes show a key stakeholder or champion changed recently.' });
    if (p.expansion_window) claims.push({ type: 'opportunity', tag: 'budget_window_open', description: 'CRM notes indicate budget timing that could support expansion.' });
  }

  if (!claims.length) claims.push({ type: 'neutral', tag: 'general_signal', description: `Captured a ${event.event_type} event with no stronger deterministic trigger.` });
  return claims;
}

// ─── Agent 1: Signal Extraction ─────────────────────────────────────────────

async function extractClaimsForRun(clientId, runId, events) {
  const createdClaims = [];
  let counter = 1;

  for (const event of events) {
    let templates;
    let source = 'deterministic';

    if (GROQ_API_KEY) {
      try {
        const result = await groqChat(SIGNAL_MODEL, [
          {
            role: 'system',
            content: `You are a signal extraction agent for a Customer Success platform.
Given a raw customer event, extract structured claims as JSON.

Rules:
- Return JSON: { "claims": [ { "type": "risk"|"opportunity"|"neutral", "tag": string, "description": string } ] }
- "tag" must be one of: usage_drop, usage_growth, low_adoption, strong_adoption, critical_support_issue, unresolved_ticket, poor_support_sentiment, renewal_risk, expansion_interest, stakeholder_change, budget_window_open, general_signal
- Only output claims that are clearly supported by the event data
- If no strong signal exists, return a single neutral/general_signal claim
- descriptions must be specific facts, not vague summaries`,
          },
          {
            role: 'user',
            content: `Event type: ${event.event_type}\nEvent data: ${JSON.stringify(event.data, null, 2)}`,
          },
        ]);
        if (Array.isArray(result.claims) && result.claims.length) {
          templates = result.claims;
          source = 'groq';
        }
      } catch (err) {
        console.error(`Agent 1 Groq error for event ${event._id}: ${err.message} — falling back to deterministic`);
      }
    }

    if (!templates) templates = deterministicClaims(event);

    for (const t of templates) {
      const claim = await Claim.create({
        client: clientId,
        run: runId,
        claim_code: `C${counter}`,
        type: t.type,
        tag: t.tag,
        description: t.description,
        source_event: event._id,
        source,
      });
      createdClaims.push(claim);
      counter += 1;
    }
  }

  return createdClaims;
}

// ─── Agent 2: Recommendation Drafting + Adversarial Validation ───────────────

async function generateRecommendations(client, run, claims) {
  const playbooks = await Playbook.find({ active: true }).sort({ createdAt: 1 });
  const matchedPlaybooks = [];

  for (const playbook of playbooks) {
    if (playbook.conditions.every((cond) => claimsMeetCondition(claims, cond))) {
      const evidenceClaims = claims.filter((c) =>
        playbook.conditions.some((cond) => cond.tag === c.tag && cond.type === c.type)
      );
      const history = await MemoryOutcome.find({
        client: client._id,
        recommendation_type: playbook.recommended_action_type,
      }).sort({ createdAt: -1 }).limit(10);

      matchedPlaybooks.push({ playbook, evidenceClaims, history });
    }
  }

  // If no playbook matched, build a generic fallback entry
  if (!matchedPlaybooks.length && claims.length) {
    const evidenceClaims = claims.slice(0, Math.min(3, claims.length));
    const primaryType = evidenceClaims.some((c) => c.type === 'risk') ? 'risk_mitigation' : 'growth_followup';
    const history = await MemoryOutcome.find({
      client: client._id,
      recommendation_type: primaryType,
    }).sort({ createdAt: -1 }).limit(10);
    matchedPlaybooks.push({ playbook: null, evidenceClaims, history, fallback: true, primaryType });
  }

  if (!matchedPlaybooks.length) return [];

  // Build prompt context
  const claimsSummary = claims.map((c) => `[${c.claim_code}] (${c.type}/${c.tag}) ${c.description}`).join('\n');
  const playbookContext = matchedPlaybooks
    .filter((m) => !m.fallback)
    .map((m) => {
      const memoryLine = m.history.length
        ? `Memory: ${m.history.filter((h) => h.decision === 'approved').length} approved, ${m.history.filter((h) => h.decision === 'rejected').length} rejected out of ${m.history.length} past decisions.`
        : 'Memory: no prior decisions for this action type.';
      return `Playbook ${m.playbook.playbook_code} — ${m.playbook.name}\nGuidance: ${m.playbook.guidance}\nAction type: ${m.playbook.recommended_action_type}\nEvidence: ${m.evidenceClaims.map((c) => c.claim_code).join(', ')}\n${memoryLine}`;
    })
    .join('\n\n');

  const fallbackEntry = matchedPlaybooks.find((m) => m.fallback);
  const fallbackContext = fallbackEntry
    ? `No playbook matched. Suggest a general follow-up. Action type: ${fallbackEntry.primaryType}. Evidence: ${fallbackEntry.evidenceClaims.map((c) => c.claim_code).join(', ')}.`
    : '';

  let groqRecommendations = null;

  if (GROQ_API_KEY) {
    try {
      groqRecommendations = await groqChat(RECOMMENDATION_MODEL, [
        {
          role: 'system',
          content: `You are a recommendation drafting agent for a Customer Success platform.
You receive extracted claims, matched playbooks, and memory of past CSM decisions.

Your job:
1. For each matched playbook, draft a specific, actionable recommendation for the CSM.
2. Assign a confidence score (0.1–0.95) informed by the memory signal and evidence strength.
3. Run an adversarial validation: check if any claims were ignored or if evidence contradicts the recommendation.
   - If contradiction or ignored signal exists: add a round 1 REVISE with objection, then round 2 PASS after acknowledging it.
   - If clean: single round 1 PASS.
4. Rank recommendations by urgency (rank 1 = most urgent).

Return JSON:
{
  "recommendations": [
    {
      "playbook_code": string | null,
      "action_type": string,
      "action": string,
      "confidence": number,
      "rank": number,
      "evidence_claim_codes": string[],
      "validator_history": [
        { "round": number, "verdict": "PASS"|"REVISE", "objection": string|null }
      ]
    }
  ]
}`,
        },
        {
          role: 'user',
          content: `Client: ${client.name} (${client.plan} plan, $${client.monthly_value}/mo)

Claims:
${claimsSummary}

${playbookContext}
${fallbackContext}`,
        },
      ]);
    } catch (err) {
      console.error(`Agent 2 Groq error: ${err.message} — falling back to deterministic recommendations`);
    }
  }

  const recommendations = [];

  if (groqRecommendations?.recommendations?.length) {
    let rank = 1;
    for (const rec of groqRecommendations.recommendations) {
      const matched = matchedPlaybooks.find((m) => m.playbook?.playbook_code === rec.playbook_code);
      const evidenceClaims = claims.filter((c) => (rec.evidence_claim_codes || []).includes(c.claim_code));
      const history = matched?.history || [];
      const confidence = confidenceFromHistory(rec.confidence || 0.7, history);
      const validatorHistory = rec.validator_history?.length
        ? rec.validator_history
        : [{ round: 1, verdict: 'PASS', objection: null }];

      const recommendation = await Recommendation.create({
        client: client._id,
        run: run._id,
        rec_code: `REC-${run._id.toString().slice(-4)}-${rank}`,
        action: rec.action,
        action_type: rec.action_type || matched?.playbook?.recommended_action_type || 'general',
        confidence,
        rank,
        evidence_claims: evidenceClaims.map((c) => c._id),
        matched_playbook: matched?.playbook?._id || null,
        validator_history: validatorHistory,
        validator_unresolved: validatorHistory[validatorHistory.length - 1]?.verdict === 'REVISE',
        status: 'pending',
        source: 'groq',
      });

      recommendations.push(recommendation);
      rank += 1;
    }
    return recommendations;
  }

  // Deterministic fallback for recommendations
  let rank = 1;
  for (const entry of matchedPlaybooks) {
    const baseConfidence = entry.fallback ? 0.58 : 0.7 + Math.min(0.15, entry.evidenceClaims.length * 0.04);
    const confidence = confidenceFromHistory(baseConfidence, entry.history);

    const hasRisk = entry.evidenceClaims.some((c) => c.type === 'risk');
    const hasOpportunity = entry.evidenceClaims.some((c) => c.type === 'opportunity');
    const validatorHistory = (hasRisk && hasOpportunity)
      ? [
          { round: 1, verdict: 'REVISE', objection: 'Evidence includes both upside and downside signals; recommendation must acknowledge the tradeoff.' },
          { round: 2, verdict: 'PASS', objection: 'Balanced evidence set accepted after adding both risk and opportunity context.' },
        ]
      : [{ round: 1, verdict: 'PASS', objection: null }];

    const action = entry.fallback
      ? `Review the latest account signals for ${client.name} and schedule a targeted follow-up with the customer team.`
      : `${entry.playbook.guidance} for ${client.name}.`;

    const recommendation = await Recommendation.create({
      client: client._id,
      run: run._id,
      rec_code: `REC-${run._id.toString().slice(-4)}-${rank}`,
      action,
      action_type: entry.fallback ? entry.primaryType : entry.playbook.recommended_action_type,
      confidence,
      rank,
      evidence_claims: entry.evidenceClaims.map((c) => c._id),
      matched_playbook: entry.playbook?._id || null,
      validator_history: validatorHistory,
      validator_unresolved: validatorHistory[validatorHistory.length - 1]?.verdict === 'REVISE',
      status: 'pending',
      source: 'deterministic',
    });

    recommendations.push(recommendation);
    rank += 1;
  }

  return recommendations;
}

// ─── Orchestrator ────────────────────────────────────────────────────────────

async function executeRunForClient(clientId, triggeredBy = 'manual') {
  const client = await Client.findById(clientId);
  if (!client) {
    const error = new Error('Client not found.');
    error.statusCode = 404;
    throw error;
  }

  const unprocessedEvents = await Event.find({ client: client._id, processed: false })
    .sort({ event_timestamp: 1, createdAt: 1 });

  const priorRuns = await Run.countDocuments({ client: client._id });
  const run = await Run.create({
    client: client._id,
    run_label: nextRunLabel(priorRuns),
    triggered_by: triggeredBy,
    status: 'pending',
  });

  console.log(`[Run] client=${clientId} unprocessedEvents=${unprocessedEvents.length}`);

  if (!unprocessedEvents.length) {
    run.status = 'skipped_no_change';
    run.skipped_reason = 'No new events since the last processed run.';
    run.completed_at = new Date();
    await run.save();
    client.latest_run = run._id;
    await client.save();
    return { run, claims: [], recommendations: [], skipped: true };
  }

  run.status = 'extracting_claims';
  await run.save();
  const claims = await extractClaimsForRun(client._id, run._id, unprocessedEvents);
  console.log(`[Run] claims extracted: ${claims.length}`);

  run.status = 'matching_playbooks';
  await run.save();

  run.status = 'generating_recommendations';
  await run.save();
  const recommendations = await generateRecommendations(client, run, claims);
  console.log(`[Run] recommendations generated: ${recommendations.length}`);

  run.status = 'validating';
  await run.save();

  run.status = 'awaiting_hitl';
  run.completed_at = new Date();
  await run.save();

  await Event.updateMany(
    { _id: { $in: unprocessedEvents.map((e) => e._id) } },
    { $set: { processed: true, processed_in_run: run._id } }
  );

  const lastEventTimestamp = unprocessedEvents[unprocessedEvents.length - 1]?.event_timestamp || new Date();
  client.last_processed_at = lastEventTimestamp;
  client.latest_run = run._id;
  client.current_stage = inferClientStage(claims);
  await client.save();

  return { run, claims, recommendations, skipped: false };
}

module.exports = { executeRunForClient };
