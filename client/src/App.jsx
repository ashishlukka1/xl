import { startTransition, useEffect, useState } from 'react'
import './App.css'
import { useAuth } from './hooks/useAuth'
import { useDashboard } from './hooks/useDashboard'
import Sidebar from './components/Sidebar'
import AccountDetail from './components/AccountDetail'

function App() {
  const [screen, setScreen] = useState('loading')
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [globalError, setGlobalError] = useState('')
  const [globalStatus, setGlobalStatus] = useState('')

  const auth = useAuth(
    async (token) => {
      await dash.refreshWorkspace(token)
      startTransition(() => setScreen('dashboard'))
    },
    () => dash.resetWorkspace()
  )

  const dash = useDashboard(
    auth.token,
    (msg) => {
      if (msg === 'SESSION_EXPIRED') {
        auth.handleLogout(setScreen)
        setGlobalError('Your session expired. Please sign in again.')
      } else {
        setGlobalError(msg)
      }
    },
    setGlobalStatus
  )

  useEffect(() => {
    const saved = localStorage.getItem('velocis-token')
    if (saved) {
      auth.hydrateSession(saved).then((ok) => { if (!ok) setScreen('landing') })
    } else {
      setScreen('landing')
    }
  }, [])

  useEffect(() => { setGlobalError(''); setGlobalStatus('') }, [screen])

  if (screen === 'loading') {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading workspace…</p>
      </div>
    )
  }

  if (screen === 'landing') {
    return (
      <div className="landing">
        <nav className="landing-nav">
          <span className="brand">Velocis NBA</span>
          <button className="btn-outline" onClick={() => { setAuthMode('login'); setScreen('login') }}>Sign In</button>
        </nav>
        <main className="landing-hero">
          <div className="hero-text">
            <p className="hero-eyebrow">Customer Success Intelligence</p>
            <h1>Next Best Actions, backed by evidence.</h1>
            <p className="hero-sub">
              Raw product signals, support tickets, and meeting notes become ranked, auditable
              recommendations — with memory-backed confidence calibration.
            </p>
            <div className="hero-btns">
              <button className="btn-primary" onClick={() => { setAuthMode('login'); setScreen('login') }}>Enter Workspace</button>
              <button className="btn-outline" onClick={() => { setAuthMode('register'); setScreen('login') }}>Create Account</button>
            </div>
          </div>
          <div className="hero-card">
            <p className="card-eyebrow">How it works</p>
            <ol className="flow-list">
              <li><span className="step-num">1</span>Raw events land as timestamped records</li>
              <li><span className="step-num">2</span>Signal agent extracts tagged evidence claims</li>
              <li><span className="step-num">3</span>Playbook engine matches claims to rules</li>
              <li><span className="step-num">4</span>Recommendation agent drafts ranked actions</li>
              <li><span className="step-num">5</span>CSM approves, edits, or rejects each one</li>
              <li><span className="step-num">6</span>Decisions feed memory for future calibration</li>
            </ol>
          </div>
        </main>
      </div>
    )
  }

  if (screen === 'login') {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <button className="back-link" onClick={() => setScreen('landing')}>← Back</button>
          <h2>{authMode === 'login' ? 'Sign in to your workspace' : 'Create a CSM account'}</h2>
          <form className="auth-form" onSubmit={(e) => { e.preventDefault(); auth.handleAuthSubmit(authMode, authForm, setScreen) }}>
            {authMode === 'register' && (
              <label>Name<input value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} placeholder="Avery Chen" required /></label>
            )}
            <label>Email<input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} placeholder="you@company.com" required /></label>
            <label>Password<input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} placeholder="Min. 8 characters" minLength={8} required /></label>
            <button className="btn-primary" type="submit" disabled={auth.isBusy}>
              {auth.isBusy ? 'Working…' : authMode === 'login' ? 'Sign In' : 'Register'}
            </button>
          </form>
          <button className="text-link" onClick={() => setAuthForm({ name: '', email: '', password: '' }) || setAuthMode(authMode === 'login' ? 'register' : 'login')}>
            {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
          </button>
          {auth.errorMessage && <p className="msg error">{auth.errorMessage}</p>}
          {auth.statusMessage && <p className="msg success">{auth.statusMessage}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <Sidebar
        filteredAccounts={dash.filteredAccounts}
        selectedAccountId={dash.selectedAccountId}
        search={dash.search}
        onSearch={dash.setSearch}
        onSelectAccount={(id) => { dash.setSelectedAccountId(id); dash.loadAccountDetail(id) }}
        user={auth.user}
        onLogout={() => auth.handleLogout(setScreen)}
        onCreateClient={(form, setForm, empty) => dash.handleCreateClient(form, setForm, empty)}
        isBusy={dash.isBusy}
      />
      <main className="main-content">
        {(globalError || globalStatus) && (
          <div className="global-msgs">
            {globalError && <p className="msg error">{globalError}</p>}
            {globalStatus && <p className="msg success">{globalStatus}</p>}
          </div>
        )}
        <AccountDetail
          selectedAccount={dash.selectedAccount}
          accountDetail={dash.accountDetail}
          playbooks={dash.playbooks}
          isBusy={dash.isBusy}
          selectedAccountId={dash.selectedAccountId}
          onRunAnalysis={() => dash.handleRunAnalysis(dash.selectedAccountId)}
          onDecision={(id, decision, draft) => dash.handleDecision(id, decision, draft, dash.selectedAccountId)}
          onLogEvent={(form) => dash.handleLogEvent(form, dash.selectedAccountId)}
        />
      </main>
    </div>
  )
}

export default App
