import { createContext } from 'react'
import type { AuthResult, AuthUser } from '../services/auth'

export interface AuthContextValue {
  user: AuthUser | null
  sessionExpired: boolean
  signIn: (result: AuthResult) => void
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
