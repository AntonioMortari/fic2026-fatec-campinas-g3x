import { useAuth } from '../../contexts/useAuth'
import { NotFound } from '../../pages/NotFound'
import { LoadingSession } from '../auth/LoadingSession'
import { Layout } from '../layout/Layout'
import { AdminLayout } from './AdminLayout'

// Staff get the panel's own frame; everyone else gets the public site's 404, so the panel does not announce that it
// exists. This only decides what to draw: the API asks the database whether the account is staff on every request.
export function RequireStaff() {
  const { user, status } = useAuth()

  if (status === 'loading') return <LoadingSession />
  if (!user?.isStaff) {
    return (
      <Layout>
        <NotFound />
      </Layout>
    )
  }
  return <AdminLayout />
}
