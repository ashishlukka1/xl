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
        <p>Loading workspace...</p>
      </div>
    )
  }

  if (screen === 'landing') {
    return (
      <div className="landing">
        <nav className="landing-nav">
          <span className="brand">NBA Platform</span>
          <div className="landing-nav-actions">
            <button className="btn-outline" onClick={() => { setAuthMode('login'); setScreen('login') }}>Sign In</button>
            <button className="btn-primary" onClick={() => { setAuthMode('register'); setScreen('login') }}>Start Free</button>
          </div>
        </nav>

        <main className="landing-main">
          <section className="landing-hero">
            <div className="hero-text">
              <p className="hero-eyebrow">Customer Success Intelligence</p>
              <h1>Next best actions with the audit trail your team actually trusts.</h1>
              <p className="hero-sub">
                Velocis turns usage shifts, support pain, CRM notes, and meeting sentiment into
                ranked customer actions your CSMs can review fast and explain clearly.
              </p>
              <div className="hero-btns">
                <button className="btn-primary" onClick={() => { setAuthMode('login'); setScreen('login') }}>Enter Workspace</button>
                <button className="btn-outline" onClick={() => { setAuthMode('register'); setScreen('login') }}>Create Account</button>
              </div>
              <div className="hero-metrics">
                <div className="hero-metric">
                  <strong>6</strong>
                  <span>signal streams unified</span>
                </div>
                <div className="hero-metric">
                  <strong>100%</strong>
                  <span>playbook-visible reasoning</span>
                </div>
                <div className="hero-metric">
                  <strong>1 view</strong>
                  <span>from event log to action</span>
                </div>
              </div>
            </div>

            <div className="hero-stack">
              <div className="hero-console">
                <div className="hero-console-top">
                  <span className="card-eyebrow">Live signal stream</span>
                  <span className="hero-console-chip">Account: Northstar Bio</span>
                </div>
                <div className="hero-console-lines">
                  <div className="hero-console-line">
                    <span className="hero-console-time">09:14</span>
                    <span className="hero-console-event">usage_snapshot</span>
                    <span className="hero-console-copy">active seats dropped 24% week-over-week</span>
                  </div>
                  <div className="hero-console-line">
                    <span className="hero-console-time">09:18</span>
                    <span className="hero-console-event">support_ticket</span>
                    <span className="hero-console-copy">priority high, dashboard export blocked</span>
                  </div>
                  <div className="hero-console-line">
                    <span className="hero-console-time">09:24</span>
                    <span className="hero-console-event">meeting_note</span>
                    <span className="hero-console-copy">champion raised renewal risk before QBR</span>
                  </div>
                </div>
              </div>

              <div className="hero-card hero-card-floating">
                <div className="hero-card-head">
                  <p className="card-eyebrow">Planner output</p>
                  <span className="status-pill pending">Awaiting review</span>
                </div>
                <h3>Escalate with a tailored adoption recovery plan this week.</h3>
                <p>
                  Confidence rose after repeated low-usage and support-friction claims matched the
                  renewal-risk playbook.
                </p>
                <div className="hero-card-tags">
                  <span className="tag-chip">usage_drop</span>
                  <span className="tag-chip">open_ticket</span>
                  <span className="tag-chip">negative_sentiment</span>
                </div>
              </div>
            </div>
          </section>

          <section className="landing-band">
            <div className="landing-band-copy">
              <p className="section-eyebrow">Why teams use it</p>
              <h2>Designed for human review, not black-box automation.</h2>
            </div>
            <div className="feature-grid">
              <article className="feature-card">
                <span className="feature-kicker">Signals</span>
                <h3>Every raw event stays visible</h3>
                <p>CSMs can inspect source logs, timestamps, and payloads before acting on any recommendation.</p>
              </article>
              <article className="feature-card">
                <span className="feature-kicker">Rules</span>
                <h3>Playbooks stay deterministic</h3>
                <p>Matching is auditable and consistent, so teams know exactly why a guidance path fired.</p>
              </article>
              <article className="feature-card">
                <span className="feature-kicker">Memory</span>
                <h3>Feedback improves confidence</h3>
                <p>Approvals and rejections feed calibration, helping future suggestions land closer to reality.</p>
              </article>
            </div>
          </section>

          <section className="landing-process">
            <div className="process-copy">
              <p className="section-eyebrow">Operating model</p>
              <h2>A sharper loop from signal to decision.</h2>
              <p className="process-sub">
                The interface is built to move from raw evidence to action without losing the thread in between.
              </p>
            </div>
            <ol className="flow-list flow-list-modern">
              <li><span className="step-num">1</span>Raw events land as timestamped records across product, support, CRM, and notes.</li>
              <li><span className="step-num">2</span>Signal extraction converts those records into tagged evidence claims.</li>
              <li><span className="step-num">3</span>Playbooks evaluate the claims and trigger deterministic guidance.</li>
              <li><span className="step-num">4</span>Recommendations are ranked, reviewed, edited if needed, and approved by the CSM.</li>
            </ol>
          </section>

          <section className="landing-cta">
            <div>
              <p className="section-eyebrow">Ready to try it</p>
              <h2>Bring your customer signals into one calm workspace.</h2>
              <p className="cta-copy">
                Keep the same evidence-first approach your team already trusts, with a faster path to next steps.
              </p>
            </div>
            <div className="hero-btns">
              <button className="btn-primary" onClick={() => { setAuthMode('register'); setScreen('login') }}>Create Account</button>
              <button className="btn-outline" onClick={() => { setAuthMode('login'); setScreen('login') }}>Sign In</button>
            </div>
          </section>
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
              {auth.isBusy ? 'Working...' : authMode === 'login' ? 'Sign In' : 'Register'}
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
