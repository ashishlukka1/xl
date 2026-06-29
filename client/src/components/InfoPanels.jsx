import { formatDate, titleCase, confidenceLabel } from '../utils'

export function RunHistory({ runs }) {
  if (!runs?.length) return <p className="empty-state">No runs yet for this account.</p>
  return (
    <div className="timeline-list">
      {runs.map((run) => (
        <div key={run._id} className="timeline-card">
          <div className="timeline-top">
            <span className="timeline-label">{run.run_label}</span>
            <span className={`status-pill ${run.status}`}>{titleCase(run.status)}</span>
          </div>
          <small>Triggered by {run.triggered_by}</small><br />
          <small>{formatDate(run.started_at, true)}{run.completed_at ? ` → ${formatDate(run.completed_at, true)}` : ''}</small>
          {run.skipped_reason && <p className="muted-text">{run.skipped_reason}</p>}
        </div>
      ))}
    </div>
  )
}

export function EventFeed({ events }) {
  if (!events?.length) return <p className="empty-state">No raw events logged yet.</p>
  return (
    <div className="timeline-list">
      {events.map((event) => (
        <div key={event._id} className="timeline-card">
          <div className="timeline-top">
            <span className="timeline-label">{event.event_type}</span>
            <span className={`status-pill ${event.processed ? 'processed' : 'pending'}`}>
              {event.processed ? 'Processed' : 'Pending'}
            </span>
          </div>
          <small>{formatDate(event.event_timestamp, true)}</small>
          <pre className="data-preview">{JSON.stringify(event.data, null, 2)}</pre>
        </div>
      ))}
    </div>
  )
}

export function MemoryOutcomes({ outcomes }) {
  if (!outcomes?.length) return <p className="empty-state">No calibration history yet. Approve or reject a recommendation to start learning.</p>
  return (
    <div className="timeline-list">
      {outcomes.map((outcome) => (
        <div key={outcome._id} className="timeline-card">
          <div className="timeline-top">
            <span className="timeline-label">{titleCase(outcome.recommendation_type)}</span>
            <span className={`type-pill ${outcome.decision}`}>{outcome.decision}</span>
          </div>
          <small>{confidenceLabel(outcome.confidence_at_decision)} confidence · {formatDate(outcome.createdAt, true)}</small>
        </div>
      ))}
    </div>
  )
}

export function PlaybookLibrary({ playbooks }) {
  return (
    <>
      <div className="playbook-explainer">
        <h4>What is a Playbook?</h4>
        <p>
          Playbooks are deterministic rules that map customer signals to recommended actions.
          When the signal extraction agent produces claims (e.g. <em>usage_drop</em>, <em>unresolved_ticket</em>),
          the playbook engine checks each playbook's conditions against those claims.
          If all conditions are met, that playbook fires and its guidance is passed to the
          recommendation agent to draft a specific, ranked action for the CSM.
          No AI is involved in matching — every trigger is fully auditable.
        </p>
      </div>
      {!playbooks?.length
        ? <p className="empty-state">No playbooks found.</p>
        : (
          <div className="timeline-list">
            {playbooks.map((pb) => (
              <div key={pb._id} className="timeline-card">
                <div className="timeline-top">
                  <span className="timeline-label">{pb.playbook_code} — {pb.name}</span>
                  <span className={`status-pill ${pb.active ? 'active' : 'inactive'}`}>{pb.active ? 'Active' : 'Inactive'}</span>
                </div>
                <p className="pb-guidance">{pb.guidance}</p>
                <div className="tag-row">
                  {pb.conditions.map((c, i) => (
                    <span key={i} className="tag-chip">{c.type}:{c.tag} ×{c.min_count || 1}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      }
    </>
  )
}
