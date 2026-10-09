import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'

export function RequireAuth() {
  const { user } = useAuth()
  const { pathname } = useLocation()

  if (!user) return <Navigate to={`/entrar?voltar=${encodeURIComponent(pathname)}`} replace />
  return <Outlet />
}
