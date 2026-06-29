import { formatDate, titleCase, confidenceLabel } from '../utils'

function formatLogPreview(data) {
  if (!data || typeof data !== 'object') return 'No payload'

  return Object.entries(data)
    .slice(0, 3)
    .map(([key, value]) => `${key}=${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join('  ')
}

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
    <div className="event-log-list">
      {events.map((event, index) => (
        <article key={event._id} className="event-log-entry">
          <div className="event-log-gutter">
            <span className="event-log-line">{String(index + 1).padStart(3, '0')}</span>
            <span className="event-log-time">{formatDate(event.event_timestamp, true)}</span>
          </div>
          <div className="event-log-body">
            <div className="event-log-top">
              <span className="event-log-type">{event.event_type}</span>
              <span className={`status-pill ${event.processed ? 'processed' : 'pending'}`}>
                {event.processed ? 'Processed' : 'Pending'}
              </span>
            </div>
            <p className="event-log-preview">{formatLogPreview(event.data)}</p>
            <pre className="event-log-data">{JSON.stringify(event.data, null, 2)}</pre>
          </div>
        </article>
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
