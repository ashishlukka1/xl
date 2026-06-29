# Velocis NBA Demo Workflow

## Seeded company

Use one realistic customer account for the existing CSM user:

- CSM: `ashishlukka2005@gmail.com`
- Client: `Northstar Analytics`
- Client ID: `NS-001`
- Plan: `Enterprise`
- Monthly value: `42000`

## What gets created

The workflow should populate the minimum end-to-end path across your schemas:

1. `CsmUser`
   Uses the existing Ashish user already present in MongoDB.

2. `Playbook`
   Creates deterministic playbooks for:
   - adoption recovery
   - support escalation
   - expansion qualification

3. `Client`
   Creates Northstar Analytics and assigns it to Ashish.

4. `Event`
   Creates:
   - historical positive usage and meeting events
   - fresh negative usage, support, meeting, and CRM events

5. `Run`
   Creates:
   - one historical run that becomes an approved outcome
   - one current run awaiting HITL review

6. `Claim`
   Automatically generated from events by the existing deterministic extraction logic.

7. `Recommendation`
   Automatically generated from claims and matched playbooks.

8. `MemoryOutcome`
   Stores one approved historical recommendation so the next run has calibration history.

## Expected story in the dashboard

Northstar Analytics should show this progression:

1. Earlier healthy adoption and expansion interest.
2. A successful expansion recommendation that Ashish approved.
3. New deterioration:
   - usage drops
   - support ticket remains open
   - meeting notes indicate renewal risk
   - executive stakeholder changed
4. A fresh planner run creates new recommendations with evidence and confidence.
5. Ashish can now approve, edit, or reject the pending recommendations from the dashboard.

## Preferred data setup

If you do not want demo data hardcoded in code, use the paste-ready objects in:

[demo-seed-objects.md](/D:/projects/xl/server/docs/demo-seed-objects.md)

That file gives you MongoDB documents for:

- `playbooks`
- `clients`
- `events`
- optional `memoryoutcomes`

Then trigger:

```http
POST /api/clients/:clientId/runs
```

to let the app generate `runs`, `claims`, and `recommendations`.

## Optional script

If you still want a one-command seed, the script is env-driven now:

```bash
node scripts/seedDemoWorkflow.js
```

## Two-agent logic for this project

For a simpler implementation, use two AI agents plus deterministic playbook matching:

### Agent 1: Signal Extraction Agent

Input:
- newly ingested raw events for one client

Output:
- strict JSON claims
- each claim contains:
  - `type`
  - `tag`
  - `description`
  - `source_event`

Responsibility:
- normalize noisy text into auditable facts
- never generate recommendations
- never invent evidence

Best model role:
- fast model
- high JSON reliability

### Agent 2: Recommendation and Validator Agent

Input:
- claims from agent 1
- matched deterministic playbooks
- recent memory outcomes for the same client and recommendation type

Output:
- ranked recommendations
- confidence score
- explicit evidence references
- validator notes if evidence was contradictory or incomplete

Responsibility:
- draft the action
- explain why it is recommended
- lower confidence when memory shows repeated rejection
- raise or maintain confidence when similar recommendations were approved

Best model role:
- stronger reasoning model
- better synthesis across multiple claims and playbook rules

## Groq setup recommendation

Use Groq's OpenAI-compatible chat completions API with two different model roles configured from env:

- Agent 1:
  `llama-3.1-8b-instant`
  Use this for fast structured claim extraction.

- Agent 2:
  `llama-3.3-70b-versatile`
  Use this for recommendation drafting and adversarial validation.

Model availability can vary by Groq account, so use these if they appear in your Groq project.

## Where to paste Groq API keys

Add these keys to `server/.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_SIGNAL_MODEL=llama-3.1-8b-instant
GROQ_RECOMMENDATION_MODEL=llama-3.3-70b-versatile
DEMO_CSM_EMAIL=ashishlukka2005@gmail.com
DEMO_CLIENT_ID=NS-001
```

You already have:

```env
MONGODB_URI=...
JWT_SECRET=...
PORT=3000
```

## Suggested API shape

One backend orchestration endpoint is enough:

- `POST /api/clients/:clientId/runs`

Internal flow:

1. load unprocessed events
2. call agent 1
3. store claims
4. run deterministic playbook matching
5. load memory outcomes
6. call agent 2
7. store recommendations
8. mark run as `awaiting_hitl`

## Why this works well

- deterministic rule matching keeps the system auditable
- the first agent stays narrow and structured
- the second agent focuses on decision quality instead of extraction noise
- memory outcomes make confidence calibration measurable over time
