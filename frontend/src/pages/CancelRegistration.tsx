import { Link, useSearchParams } from 'react-router-dom'
import { LoadingSession } from '../components/auth/LoadingSession'
import { Button, Card, DateBadge, EmptyState, PageHeader } from '../components/ui'
import { CONTACTS } from '../lib/contacts'
import { shortDate } from '../lib/dates'
import { formatTimeRange } from '../lib/events'
import { parseApiError } from '../lib/api-error'
import { useCancelPreview, useCancelRegistration } from '../services/cancel-registration'
import { useEvents } from '../services/events'
import type { CancelPreview } from '../types/cancel-registration'

const CODE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function Elsewhere({ eventId }: { eventId: string }) {
  const { data } = useEvents('upcoming')
  const others = (data ?? []).filter((event) => event.id !== eventId && event.spotsLeft !== 0).slice(0, 3)
  if (others.length === 0) return null

  return (
    <section aria-labelledby="other-dates" className="flex flex-col gap-1 border-t border-line pt-4">
      <h2 id="other-dates" className="m-0 text-item font-bold">
        Quer ir em outra data?
      </h2>
      <ul className="m-0 list-none p-0">
        {others.map((event) => (
          <li key={event.id} className="border-b border-line last:border-b-0">
            <Link to={`/agenda/${event.id}/inscricao`} className="flex min-h-14 items-center gap-3.5 text-brown no-underline hover:text-brown">
              <span className="text-small font-bold whitespace-nowrap text-ochre-deep uppercase">{shortDate(event.startsAt)}</span>
              <span className="font-semibold">{event.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

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

function Done({ registration }: { registration: CancelPreview }) {
  const { event } = registration
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        <p className="m-0 self-start bg-brown px-2.5 py-1 text-overline font-bold tracking-[0.12em] text-cream uppercase">Feito</p>
        <h1 className="m-0 text-h1 font-bold">Inscrição cancelada</h1>
        <p className="m-0 text-body text-pretty text-brown-600">
          Sua vaga em <strong>{event.title}</strong> ({shortDate(event.startsAt)}) foi liberada. Obrigado por avisar — isso ajuda outra família a vir.
        </p>
      </div>
      <Button to="/agenda" variant="applique">
        Ver a agenda
      </Button>
      <Elsewhere eventId={event.id} />
    </div>
  )
}

function Confirm({ registration, onConfirm, busy, failed }: { registration: CancelPreview; onConfirm: () => void; busy: boolean; failed: string | null }) {
  const { event, name } = registration
  const when = [formatTimeRange(event), event.location].filter(Boolean).join(' · ')

  return (
    <div className="flex flex-col gap-5">
      <PageHeader overline="Sua inscrição" title="Cancelar a inscrição?" className="pt-0" />
      <Card as="section" aria-label="A inscrição" className="flex items-center gap-3.5 p-3.5">
        <DateBadge date={new Date(event.startsAt)} highlight />
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="m-0 text-item leading-tight font-bold">{event.title}</h2>
          <p className="m-0 text-small text-brown-400">{when}</p>
          <p className="m-0 text-small font-semibold">Inscrição de {name}</p>
        </div>
      </Card>
      <p className="m-0 text-body text-pretty text-brown-600">
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

  if (cancel.isSuccess) return <Done registration={cancel.data} />
  if (preview.data.state === 'cancelled') return <Closed title="Esta inscrição já foi cancelada" />
  if (preview.data.state === 'over') return <Closed title="Esta atividade já aconteceu" />

  const error = cancel.isError ? parseApiError(cancel.error) : null
  if (error?.code === 'already_cancelled') return <Closed title="Esta inscrição já foi cancelada" />
  if (error?.code === 'registrations_closed') return <Closed title="Esta atividade já aconteceu" />

  return (
    <Confirm
      registration={preview.data}
      onConfirm={() => cancel.mutate()}
      busy={cancel.isPending}
      failed={error ? error.message : null}
    />
  )
}
