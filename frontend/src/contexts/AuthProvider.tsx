import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthResult, AuthUser } from '../services/auth'
import { setToken, setUnauthorizedHandler } from '../services/session'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  const clearSession = useCallback(
    (expired: boolean) => {
      setToken(null)
      setUser(null)
      setSessionExpired(expired)
      queryClient.removeQueries({ queryKey: ['me'] })
    },
    [queryClient],
  )

  const signIn = useCallback(({ token, user: signedIn }: AuthResult) => {
    setToken(token)
    setUser(signedIn)
    setSessionExpired(false)
  }, [])

  const signOut = useCallback(() => clearSession(false), [clearSession])

  useEffect(() => {
    setUnauthorizedHandler(() => clearSession(true))
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  const value = useMemo(() => ({ user, sessionExpired, signIn, signOut }), [user, sessionExpired, signIn, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
