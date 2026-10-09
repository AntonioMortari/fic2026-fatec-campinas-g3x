import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import { LoadingSession } from './LoadingSession'

export function RequireAuth() {
  const { user, status } = useAuth()
  const { pathname } = useLocation()

  if (status === 'loading') return <LoadingSession />
  if (!user) return <Navigate to={`/entrar?voltar=${encodeURIComponent(pathname)}`} replace />
  return <Outlet />
}
