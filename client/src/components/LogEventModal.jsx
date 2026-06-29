import { useState } from 'react'

const templates = {
  usage_snapshot: '{\n  "usage_change_pct": -24,\n  "adoption_score": 42,\n  "active_seats": 132,\n  "licensed_seats": 180\n}',
  support_ticket: '{\n  "priority": "high",\n  "status": "open",\n  "csat": 2,\n  "summary": "Customer cannot export dashboard data."\n}',
  meeting_note: '{\n  "sentiment": "negative",\n  "renewal_risk": true,\n  "expansion_interest": false,\n  "note": "Champion is worried about low team adoption."\n}',
  crm_note: '{\n  "executive_sponsor_change": true,\n  "champion_change": false,\n  "expansion_window": false,\n  "note": "New stakeholder joined and wants a fresh value review."\n}',
}

export default function LogEventModal({ isBusy, onLogEvent, onClose }) {
  const [form, setForm] = useState({ event_type: 'usage_snapshot', event_timestamp: '', data: templates.usage_snapshot })

  function handleSubmit(e) {
    e.preventDefault()
    onLogEvent(form)
    onClose()
  }

  function setType(type) {
    setForm((f) => ({ ...f, event_type: type, data: templates[type] }))
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Log Event</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="stack-form" onSubmit={handleSubmit}>
          <label>Event Type
            <select value={form.event_type} onChange={(e) => setType(e.target.value)}>
              <option value="usage_snapshot">Usage Snapshot</option>
              <option value="support_ticket">Support Ticket</option>
              <option value="meeting_note">Meeting Note</option>
              <option value="crm_note">CRM Note</option>
            </select>
          </label>
          <label>Timestamp
            <input type="datetime-local" value={form.event_timestamp} onChange={(e) => setForm((f) => ({ ...f, event_timestamp: e.target.value }))} required />
          </label>
          <label>JSON Payload
            <textarea value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} />
          </label>
          <button className="btn-primary" type="submit" disabled={isBusy}>
            {isBusy ? 'Logging…' : 'Log Event'}
          </button>
        </form>
      </div>
    </div>
  )
}
