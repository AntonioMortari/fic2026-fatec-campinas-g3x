import { Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import { NotFound } from '../../pages/NotFound'
import { LoadingSession } from '../auth/LoadingSession'

// A 404 and not a redirect: the panel does not announce that it exists. This only decides what to draw; the API
// asks the database whether the account is staff on every request.
export function RequireStaff() {
  const { user, status } = useAuth()

  if (status === 'loading') return <LoadingSession />
  if (!user?.isStaff) return <NotFound />
  return <Outlet />
}
