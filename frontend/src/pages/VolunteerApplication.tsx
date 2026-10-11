import { useState } from 'react'
import { LoadingSession } from '../components/auth/LoadingSession'
import { BackBar } from '../components/layout/BackBar'
import { Layout } from '../components/layout/Layout'
import { Button, Container, EmptyState } from '../components/ui'
import { ApplicationStatus } from '../components/volunteering/ApplicationStatus'
import { LoginRequired } from '../components/volunteering/LoginRequired'
import { VolunteerForm } from '../components/volunteering/VolunteerForm'
import { useAuth } from '../contexts/useAuth'
import { findLive } from '../lib/volunteering'
import { useMyVolunteerApplications, useVolunteerAreas } from '../services/volunteering'

function RetryCard({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <EmptyState
      tone="error"
      title={title}
      text="Tente de novo em alguns minutos."
      actions={
        <Button variant="secondary" size="compact" onClick={onRetry}>
          Tentar de novo
        </Button>
      }
    />
  )
}

export function VolunteerApplicationPage() {
  const { user, status } = useAuth()
  const areas = useVolunteerAreas(Boolean(user))
  const mine = useMyVolunteerApplications(Boolean(user))
  const [justSent, setJustSent] = useState(false)

  const live = mine.data ? findLive(mine.data) : null
  const hasChrome = Boolean(live)
  const showsForm = Boolean(user) && mine.isSuccess && !live && areas.isSuccess

  let body
  if (status === 'loading') body = <LoadingSession />
  else if (!user) body = <LoginRequired />
  else if (mine.isPending) body = <LoadingSession />
  else if (mine.isError) body = <RetryCard title="Não conseguimos carregar sua candidatura" onRetry={() => void mine.refetch()} />
  else if (live) body = <ApplicationStatus application={live} focusTitle={justSent} />
  else if (areas.isPending) body = <LoadingSession />
  else if (areas.isError || !areas.data) body = <RetryCard title="Não conseguimos carregar as áreas" onRetry={() => void areas.refetch()} />
  else body = <VolunteerForm areas={areas.data} user={user} onSent={() => setJustSent(true)} />

  return (
    <Layout hideHeaderOnMobile={!hasChrome} hideBottomBar={!hasChrome}>
      {!hasChrome && <BackBar to="/voluntariado" label="Voluntariado" onDesktop={!showsForm} />}
      <Container>{body}</Container>
    </Layout>
  )
}
