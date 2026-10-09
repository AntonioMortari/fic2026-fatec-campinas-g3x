import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { LoadingSession } from '../components/auth/LoadingSession'
import { EventSummaryCard } from '../components/registration/EventSummaryCard'
import { RegistrationDone } from '../components/registration/RegistrationDone'
import { RegistrationForm } from '../components/registration/RegistrationForm'
import { Button, EmptyState, PageHeader } from '../components/ui'
import { useAuth } from '../contexts/useAuth'
import { useEvent } from '../services/events'
import { NotFound } from './NotFound'

export function EventRegistration() {
  const { id } = useParams()
  const { user, status } = useAuth()
  const event = useEvent(id)
  const [done, setDone] = useState<{ name: string; cancelCode: string } | null>(null)
  const [round, setRound] = useState(0)

  if (status === 'loading' || event.isPending) return <LoadingSession />

  if (event.isError) {
    if ((event.error as { response?: { status?: number } }).response?.status === 404) return <NotFound />
    return (
      <EmptyState
        tone="error"
        title="Não conseguimos carregar a atividade"
        text="Tente de novo em alguns minutos."
        actions={
          <Button variant="secondary" size="compact" onClick={() => void event.refetch()}>
            Tentar de novo
          </Button>
        }
      />
    )
  }

  const detail = event.data

  if (done) {
    return (
      <RegistrationDone
        event={detail}
        name={done.name}
        cancelCode={done.cancelCode}
        onAnother={() => {
          setRound((current) => current + 1)
          setDone(null)
        }}
      />
    )
  }

  if (!detail.registrationsOpen) {
    const soldOut = detail.spotsLeft === 0
    return (
      <div className="flex flex-col gap-5">
        <EventSummaryCard event={detail} showSpots={false} />
        <EmptyState
          title={soldOut ? 'As vagas desta atividade acabaram' : 'As inscrições desta atividade já encerraram'}
          text="Veja o que mais está marcado na agenda."
          actions={<Button to="/agenda">Ver a agenda</Button>}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-24 desktop:pb-0">
      <EventSummaryCard event={detail} />
      <PageHeader
        title="Sua inscrição"
        lead={user ? undefined : 'Não precisa criar conta. Leva 1 minuto.'}
        className="py-0 desktop:py-0"
      />
      <RegistrationForm key={round} event={detail} account={user} onDone={setDone} />
    </div>
  )
}
