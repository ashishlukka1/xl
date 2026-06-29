import { useState } from 'react'
import { apiRequest } from '../api'

export function useAuth(onLogin, onLogout) {
  const [token, setToken] = useState(() => localStorage.getItem('velocis-token') || '')
  const [user, setUser] = useState(null)
  const [isBusy, setIsBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  async function hydrateSession(sessionToken) {
    try {
      setIsBusy(true)
      const auth = await apiRequest('/api/auth/me', {}, sessionToken)
      setUser(auth.user)
      setToken(sessionToken)
      localStorage.setItem('velocis-token', sessionToken)
      await onLogin(sessionToken)
      return true
    } catch {
      localStorage.removeItem('velocis-token')
      setToken('')
      setUser(null)
      return false
    } finally {
      setIsBusy(false)
    }
  }

  async function handleAuthSubmit(authMode, authForm, setScreen) {
    setErrorMessage('')
    setStatusMessage('')
    try {
      setIsBusy(true)
      const path = authMode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const payload = authMode === 'login'
        ? { email: authForm.email, password: authForm.password }
        : authForm
      const data = await apiRequest(path, { method: 'POST', body: JSON.stringify(payload) })
      setUser(data.user)
      setToken(data.token)
      localStorage.setItem('velocis-token', data.token)
      await onLogin(data.token)
      setStatusMessage(authMode === 'login' ? 'Signed in successfully.' : 'CSM account created.')
      startTransition(() => setScreen('dashboard'))
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsBusy(false)
    }
  }

  function handleLogout(setScreen) {
    localStorage.removeItem('velocis-token')
    setToken('')
    setUser(null)
    onLogout()
    setScreen('landing')
  }

  return { token, user, isBusy, errorMessage, statusMessage, setErrorMessage, setStatusMessage, hydrateSession, handleAuthSubmit, handleLogout }
}
