import { useDeferredValue, useMemo, useState } from 'react'
import { apiRequest } from '../api'

export function useDashboard(token, onError, onStatus) {
  const [dashboard, setDashboard] = useState({ stats: null, accounts: [] })
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [accountDetail, setAccountDetail] = useState(null)
  const [playbooks, setPlaybooks] = useState([])
  const [isBusy, setIsBusy] = useState(false)
  const [search, setSearch] = useState('')

  const deferredSearch = useDeferredValue(search)

  const filteredAccounts = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase()
    if (!q) return dashboard.accounts
    return dashboard.accounts.filter((a) =>
      a.name.toLowerCase().includes(q) ||
      a.clientId.toLowerCase().includes(q) ||
      a.currentStage.toLowerCase().includes(q)
    )
  }, [dashboard.accounts, deferredSearch])

  const selectedAccount = useMemo(
    () => dashboard.accounts.find((a) => a.id === selectedAccountId) || null,
    [dashboard.accounts, selectedAccountId]
  )

  async function refreshWorkspace(activeToken = token, preferredAccountId = selectedAccountId) {
    const [dashboardData, playbookData] = await Promise.all([
      apiRequest('/api/dashboard', {}, activeToken),
      apiRequest('/api/playbooks', {}, activeToken),
    ])
    setDashboard(dashboardData)
    setPlaybooks(playbookData.playbooks || [])
    const nextId = preferredAccountId || dashboardData.accounts[0]?.id || ''
    setSelectedAccountId(nextId)
    if (nextId) {
      const detail = await apiRequest(`/api/clients/${nextId}`, {}, activeToken)
      setAccountDetail(detail)
    } else {
      setAccountDetail(null)
    }
  }

  async function loadAccountDetail(accountId, activeToken = token) {
    const detail = await apiRequest(`/api/clients/${accountId}`, {}, activeToken)
    setAccountDetail(detail)
  }

  async function runProtectedAction(work) {
    try {
      setIsBusy(true)
      await work()
    } catch (error) {
      if (error.status === 401) {
        onError('SESSION_EXPIRED')
        return
      }
      onError(error.message)
    } finally {
      setIsBusy(false)
    }
  }

  async function handleRunAnalysis(selectedId, triggeredBy = 'manual') {
    if (!selectedId) { onError('Choose an account first.'); return }
    onError('')
    onStatus('')
    setIsBusy(true)
    try {
      await apiRequest(
        `/api/clients/${selectedId}/runs`,
        { method: 'POST', body: JSON.stringify({ triggered_by: triggeredBy }) },
        token
      )
      await refreshWorkspace(token, selectedId)
      onStatus('Planner run completed — recommendations are awaiting review.')
    } catch (err) {
      if (err.status === 401) { onError('SESSION_EXPIRED'); return }
      onError(err.message)
    } finally {
      setIsBusy(false)
    }
  }

  async function handleDecision(recommendationId, decision, draft, activeAccountId) {
    onError('')
    onStatus('')
    await runProtectedAction(async () => {
      await apiRequest(`/api/recommendations/${recommendationId}/decision`, {
        method: 'PATCH',
        body: JSON.stringify({ decision, edited_text: draft || '' }),
      }, token)
      onStatus(`Recommendation ${decision}.`)
      await refreshWorkspace(token, activeAccountId)
    })
  }

  async function handleCreateClient(clientForm, setClientForm, emptyForm) {
    onError('')
    onStatus('')
    await runProtectedAction(async () => {
      await apiRequest('/api/clients', { method: 'POST', body: JSON.stringify(clientForm) }, token)
      setClientForm(emptyForm)
      onStatus('Account created and assigned to your book.')
      await refreshWorkspace(token)
    })
  }

  async function handleLogEvent(eventForm, activeAccountId) {
    if (!activeAccountId) { onError('Choose an account before logging an event.'); return }
    onError('')
    onStatus('')
    await runProtectedAction(async () => {
      await apiRequest(`/api/clients/${activeAccountId}/events`, {
        method: 'POST',
        body: JSON.stringify({
          event_type: eventForm.event_type,
          event_timestamp: eventForm.event_timestamp,
          data: JSON.parse(eventForm.data),
        }),
      }, token)
      onStatus('New customer signal logged successfully.')
      await refreshWorkspace(token, activeAccountId)
    })
  }

  function resetWorkspace() {
    setDashboard({ stats: null, accounts: [] })
    setSelectedAccountId('')
    setAccountDetail(null)
    setPlaybooks([])
  }

  return {
    dashboard, selectedAccountId, setSelectedAccountId, accountDetail, playbooks,
    isBusy, search, setSearch, filteredAccounts, selectedAccount,
    refreshWorkspace, loadAccountDetail, handleRunAnalysis,
    handleDecision, handleCreateClient, handleLogEvent, resetWorkspace,
  }
}
