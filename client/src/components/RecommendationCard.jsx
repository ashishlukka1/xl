import { useState } from 'react'
import { confidenceLabel, formatDate, titleCase } from '../utils'

export default function RecommendationCard({ recommendation, onDecision, isBusy }) {
  const [draft, setDraft] = useState(recommendation.action)

  return (
    <article className="rec-card">
      <div className="rec-header">
        <div className="rec-header-left">
          <span className="rec-code">{recommendation.rec_code}</span>
          <span className={`source-badge ${recommendation.source}`}>
            {recommendation.source === 'groq' ? '✦ AI' : 'Rule'}
          </span>
          <span className={`status-pill ${recommendation.status}`}>{titleCase(recommendation.status)}</span>
        </div>
        <div className="rec-header-right">
          <span className="confidence-bar-wrap">
            <span className="confidence-bar" style={{ width: `${Math.round((recommendation.confidence || 0) * 100)}%` }} />
          </span>
          <span className="confidence-label">{confidenceLabel(recommendation.confidence)}</span>
        </div>
      </div>

      <div className="rec-meta">
        <span className="action-type">{titleCase(recommendation.action_type)}</span>
        {recommendation.matched_playbook && (
          <span className="playbook-ref">{recommendation.matched_playbook.playbook_code}</span>
        )}
      </div>

      <p className="rec-action">{recommendation.action}</p>

      {recommendation.validator_history?.length > 0 && (
        <div className="validator-box">
          {recommendation.validator_history.map((round) => (
            <div key={round.round} className={`validator-round ${round.verdict.toLowerCase()}`}>
              <span className="round-label">Round {round.round}</span>
              <span className={`verdict-pill ${round.verdict.toLowerCase()}`}>{round.verdict}</span>
              {round.objection && <span className="objection">{round.objection}</span>}
            </div>
          ))}
        </div>
      )}

      {recommendation.status === 'pending' && (
        <>
          <textarea
            className="edit-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="hitl-actions">
            <button className="btn-approve" onClick={() => onDecision(recommendation._id, 'approved', draft)} disabled={isBusy}>Approve</button>
            <button className="btn-reject" onClick={() => onDecision(recommendation._id, 'rejected', draft)} disabled={isBusy}>Reject</button>
          </div>
        </>
      )}

      {recommendation.evidence_claims?.length > 0 && (
        <div className="evidence-list">
          <p className="evidence-title">Evidence</p>
          {recommendation.evidence_claims.map((claim) => (
            <div key={claim._id} className="evidence-item">
              <div className="evidence-item-header">
                <span className="claim-code">{claim.claim_code}</span>
                <span className={`type-pill ${claim.type}`}>{claim.type}</span>
                {claim.source === 'groq' && <span className="ai-chip">✦ AI</span>}
                <span className="tag-chip">{claim.tag}</span>
              </div>
              <p className="claim-desc">{claim.description}</p>
              <small className="claim-source">
                From {claim.source_event?.event_type || 'event'} · {formatDate(claim.source_event?.event_timestamp, true)}
              </small>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}
