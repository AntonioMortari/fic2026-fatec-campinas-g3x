import { useNavigate, useSearchParams } from 'react-router-dom'
import { LoadingSession } from '../components/auth/LoadingSession'
import { Button, Card, DateBadge, EmptyState, PageHeader } from '../components/ui'
import { CONTACTS } from '../lib/contacts'
import { formatTimeRange } from '../lib/events'
import { parseApiError } from '../lib/api-error'
import { useCancelPreview, useCancelRegistration } from '../services/cancel-registration'
import type { CancelPreview } from '../types/cancel-registration'

const CODE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function Whatsapp() {
  return (
    <p className="m-0 text-body text-brown-600">
      Se isso não está certo, fale com a gente pelo WhatsApp{' '}
      <a href={CONTACTS.whatsapp}>{CONTACTS.phoneDisplay}</a>.
    </p>
  )
}

function Closed({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={title} className="pt-0" />
      <Whatsapp />
      <Button to="/agenda">Ver a agenda</Button>
    </div>
  )
}

function Confirm({ registration, onConfirm, busy, failed }: { registration: CancelPreview; onConfirm: () => void; busy: boolean; failed: string | null }) {
  const { event, name } = registration
  const when = [formatTimeRange(event), event.location].filter(Boolean).join(' · ')

  return (
    <div className="flex flex-col gap-5">
      <PageHeader overline="Sua inscrição" title="Cancelar a inscrição?" className="pt-0" titleClassName="text-[1.875rem] leading-[1.1]" />
      <Card as="section" aria-label="A inscrição" className="flex items-center gap-3.5 p-3.5">
        <DateBadge date={new Date(event.startsAt)} highlight />
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="m-0 text-item leading-tight font-bold">{event.title}</h2>
          <p className="m-0 text-small text-brown-400">{when}</p>
          <p className="m-0 text-small font-semibold">Inscrição de {name}</p>
        </div>
      </Card>
      <p className="m-0 text-body text-pretty">
        A vaga volta para a agenda e outra pessoa pode ficar com ela. Se mudar de ideia, é só se inscrever de novo enquanto houver vaga.
      </p>
      {failed && <EmptyState tone="error" title={failed} />}
      <div className="flex flex-col gap-3">
        <Button variant="applique" onClick={onConfirm} disabled={busy}>
          {busy ? 'Cancelando…' : 'Sim, cancelar minha inscrição'}
        </Button>
        <Button to="/agenda" variant="secondary">
          Manter inscrição
        </Button>
      </div>
    </div>
  )
}

export function CancelRegistration() {
  const [searchParams] = useSearchParams()
  const raw = searchParams.get('c')
  const code = raw && CODE_PATTERN.test(raw) ? raw : null
  const preview = useCancelPreview(code)
  const cancel = useCancelRegistration(code)
  const navigate = useNavigate()

  if (!code) return <Closed title="Não encontramos esta inscrição" />
  if (preview.isPending) return <LoadingSession />
  if (preview.isError) {
    if (parseApiError(preview.error).code === 'registration_not_found') return <Closed title="Não encontramos esta inscrição" />
    return (
      <EmptyState
        tone="error"
        title="Não conseguimos carregar a inscrição"
        text="Tente de novo em alguns minutos."
        actions={
          <Button variant="secondary" size="compact" onClick={() => void preview.refetch()}>
            Tentar de novo
          </Button>
        }
      />
    )
  }

  if (preview.data.state === 'cancelled') return <Closed title="Esta inscrição já foi cancelada" />
  if (preview.data.state === 'over') return <Closed title="Esta atividade já aconteceu" />

  const error = cancel.isError ? parseApiError(cancel.error) : null
  if (error?.code === 'already_cancelled') return <Closed title="Esta inscrição já foi cancelada" />
  if (error?.code === 'registrations_closed') return <Closed title="Esta atividade já aconteceu" />

  return (
    <Confirm
      registration={preview.data}
      onConfirm={() =>
        cancel.mutate(undefined, {
          onSuccess: (registration) => void navigate(`/inscricao/cancelada?c=${code}`, { replace: true, state: { registration } }),
        })
      }
      busy={cancel.isPending}
      failed={error ? error.message : null}
    />
  )
}
