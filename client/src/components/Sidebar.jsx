import { useState } from 'react'
import { stageLabel } from '../utils'
import AddClientModal from './AddClientModal'

export default function Sidebar({ filteredAccounts, selectedAccountId, search, onSearch, onSelectAccount, user, onLogout, onCreateClient, isBusy }) {
  const [showAdd, setShowAdd] = useState(false)

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <span className="brand">hello! {user?.name}</span>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search accounts…" />
      </div>

      {/* Account list */}
      <nav className="sidebar-accounts">
        <p className="sidebar-section-label">Clients</p>
        {filteredAccounts.map((account) => (
          <button
            key={account.id}
            className={`account-card ${selectedAccountId === account.id ? 'active' : ''}`}
            onClick={() => onSelectAccount(account.id)}
          >
            <div className="account-card-top">
              <span className="account-name">{account.name}</span>
              {account.pendingRecommendationCount > 0 && (
                <span className="pending-badge">{account.pendingRecommendationCount}</span>
              )}
            </div>
            <div className="account-card-bottom">
              <span className="account-id">{account.clientId}</span>
              <span className={`stage-pill ${account.currentStage}`}>{stageLabel(account.currentStage)}</span>
            </div>
          </button>
        ))}
        {!filteredAccounts.length && (
          <p className="sidebar-empty">No accounts found.</p>
        )}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="btn-add-client" onClick={() => setShowAdd(true)}>+ Add Client</button>
        <div className="sidebar-user">
          <div className="user-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-email">{user?.email}</span>
          </div>
          <button className="btn-logout" onClick={onLogout} title="Logout">↩</button>
        </div>
      </div>

      {showAdd && (
        <AddClientModal
          isBusy={isBusy}
          onCreateClient={onCreateClient}
          onClose={() => setShowAdd(false)}
        />
      )}
    </aside>
  )
}
