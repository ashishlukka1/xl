import { useState } from 'react'
import RecommendationCard from './RecommendationCard'
import { RunHistory, EventFeed, MemoryOutcomes, PlaybookLibrary } from './InfoPanels'
import LogEventModal from './LogEventModal'
import { formatDate, titleCase } from '../utils'

const TABS = ['Recommendations', 'Events', 'Run History', 'Memory', 'Playbooks']

export default function AccountDetail({
  selectedAccount, accountDetail, playbooks, isBusy,
  onRunAnalysis, onDecision, onLogEvent, selectedAccountId,
}) {
  const [activeTab, setActiveTab] = useState('Recommendations')
  const [showLogEvent, setShowLogEvent] = useState(false)

  if (!selectedAccount) {
    return (
      <div className="no-account">
        <div className="no-account-icon">📊</div>
        <h3>Select a client</h3>
        <p>Choose a client from the sidebar to view details and recommendations.</p>
      </div>
    )
  }

  const latestRun = accountDetail?.runs?.[0] || null
  const pendingRecs = (accountDetail?.recommendations || []).filter((r) => r.status === 'pending')

  return (
    <div className="account-detail">
      {/* Account header */}
      <div className="detail-header">
        <div>
          <div className="detail-meta">
            <span className={`stage-pill ${selectedAccount.currentStage}`}>{titleCase(selectedAccount.currentStage)}</span>
            <span className="detail-id">{selectedAccount.clientId}</span>
            {latestRun && <span className="muted-text">{latestRun.run_label} · {titleCase(latestRun.status)}</span>}
          </div>
          <h2 className="detail-account-name">{selectedAccount.name}</h2>
        </div>
        <div className="detail-header-right">
          <button className="btn-outline" onClick={() => setShowLogEvent(true)} disabled={isBusy}>Log Event</button>
          <button className="btn-primary" onClick={onRunAnalysis} disabled={isBusy}>
            {isBusy ? 'Running…' : 'Trigger Planner Run'}
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpi-strip">
        <div className="kpi-card">
          <span className="kpi-label">Plan</span>
          <strong>{selectedAccount.plan}</strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Monthly Value</span>
          <strong>${selectedAccount.monthlyValue?.toLocaleString()}</strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Renewal</span>
          <strong>{formatDate(selectedAccount.renewalDate)}</strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Employees</span>
          <strong>{selectedAccount.employeeCount?.toLocaleString()}</strong>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === 'Recommendations' && pendingRecs.length > 0 && (
              <span className="tab-badge">{pendingRecs.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'Recommendations' && (
          <div className="rec-stack">
            {accountDetail?.recommendations?.length
              ? accountDetail.recommendations.map((rec) => (
                  <RecommendationCard key={rec._id} recommendation={rec} onDecision={onDecision} isBusy={isBusy} />
                ))
              : <p className="empty-state">No recommendations yet. Log a signal and trigger a run.</p>
            }
          </div>
        )}

        {activeTab === 'Events' && <EventFeed events={accountDetail?.events} />}
        {activeTab === 'Run History' && <RunHistory runs={accountDetail?.runs} />}
        {activeTab === 'Memory' && <MemoryOutcomes outcomes={accountDetail?.memoryOutcomes} />}
        {activeTab === 'Playbooks' && <PlaybookLibrary playbooks={playbooks} />}
      </div>

      {showLogEvent && (
        <LogEventModal
          isBusy={isBusy}
          onLogEvent={onLogEvent}
          onClose={() => setShowLogEvent(false)}
        />
      )}
    </div>
  )
}
