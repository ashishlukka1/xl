import { useState } from 'react'

const emptyForm = {
  client_id: '', name: '', plan: 'Business',
  monthly_value: 12000, employee_count: 120,
  contract_start_date: '', renewal_date: '',
}

export default function AddClientModal({ isBusy, onCreateClient, onClose }) {
  const [form, setForm] = useState(emptyForm)

  function handleSubmit(e) {
    e.preventDefault()
    onCreateClient(form, setForm, emptyForm)
    onClose()
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Client</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="stack-form" onSubmit={handleSubmit}>
          <label>Client ID<input value={form.client_id} onChange={(e) => set('client_id', e.target.value)} placeholder="NS-002" required /></label>
          <label>Company Name<input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Acme Corp" required /></label>
          <label>Plan
            <select value={form.plan} onChange={(e) => set('plan', e.target.value)}>
              <option>Starter</option><option>Business</option><option>Enterprise</option>
            </select>
          </label>
          <div className="form-row">
            <label>Monthly Value<input type="number" value={form.monthly_value} onChange={(e) => set('monthly_value', Number(e.target.value))} required /></label>
            <label>Employees<input type="number" value={form.employee_count} onChange={(e) => set('employee_count', Number(e.target.value))} /></label>
          </div>
          <div className="form-row">
            <label>Contract Start<input type="date" value={form.contract_start_date} onChange={(e) => set('contract_start_date', e.target.value)} required /></label>
            <label>Renewal Date<input type="date" value={form.renewal_date} onChange={(e) => set('renewal_date', e.target.value)} required /></label>
          </div>
          <button className="btn-primary" type="submit" disabled={isBusy}>
            {isBusy ? 'Creating…' : 'Create Client'}
          </button>
        </form>
      </div>
    </div>
  )
}
