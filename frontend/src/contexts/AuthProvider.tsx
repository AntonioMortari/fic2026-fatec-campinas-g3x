import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../services/api'
import type { AuthResult, AuthUser } from '../services/auth'
import {
  hasSessionHint,
  refreshSession,
  setRefresher,
  setSessionHint,
  setToken,
  setUnauthorizedHandler,
  type RefreshOutcome,
} from '../services/session'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [status, setStatus] = useState<'loading' | 'ready'>(() => (hasSessionHint() ? 'loading' : 'ready'))

  const clearSession = useCallback(
    (expired: boolean) => {
      setToken(null)
      setSessionHint(false)
      setUser(null)
      setSessionExpired(expired)
      queryClient.removeQueries({ queryKey: ['me'] })
    },
    [queryClient],
  )

  const signIn = useCallback(({ token, user: signedIn }: AuthResult) => {
    setToken(token)
    setSessionHint(true)
    setUser(signedIn)
    setSessionExpired(false)
  }, [])

  const signOut = useCallback(() => {
    // Best effort: without an answer the cookie stays valid on the server until it expires.
    void api.post('/auth/logout').catch(() => undefined)
    clearSession(false)
  }, [clearSession])

  useEffect(() => {
    setUnauthorizedHandler(() => clearSession(true))
    setRefresher(async (): Promise<RefreshOutcome> => {
      try {
        signIn((await api.post<AuthResult>('/auth/refresh')).data)
        return 'renewed'
      } catch (error) {
        return axios.isAxiosError(error) && error.response ? 'ended' : 'unreachable'
      }
    })
    return () => {
      setUnauthorizedHandler(null)
      setRefresher(null)
    }
  }, [clearSession, signIn])

  useEffect(() => {
    if (!hasSessionHint()) return
    let cancelled = false
    void refreshSession().then((outcome) => {
      if (cancelled) return
      if (outcome === 'ended') clearSession(true)
      setStatus('ready')
    })
    return () => {
      cancelled = true
    }
  }, [clearSession])

  const value = useMemo(
    () => ({ user, status, sessionExpired, signIn, signOut }),
    [user, status, sessionExpired, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
