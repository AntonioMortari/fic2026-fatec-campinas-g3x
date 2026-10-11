import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { Button, Container } from '../components/ui'
import { shortDate } from '../lib/dates'
import { useEvents } from '../services/events'
import type { CancelPreview } from '../types/cancel-registration'

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

export function CancelDone() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const registration = (location.state as { registration?: CancelPreview } | null)?.registration
  const code = searchParams.get('c')

  if (!registration) return <Navigate to={code ? `/inscricao/cancelar?c=${encodeURIComponent(code)}` : '/agenda'} replace />

  const { event } = registration
  return (
    <Container className="pt-7 pb-12">
      <div className="flex max-w-xl flex-col gap-5">
        <div className="flex flex-col gap-2.5">
          <p className="m-0 self-start bg-brown px-2.5 py-1 text-overline font-bold tracking-[0.1em] text-cream uppercase">Feito</p>
          <h1 className="m-0 text-[1.875rem] leading-[1.1] font-bold">Inscrição cancelada</h1>
          <p className="m-0 text-body text-pretty">
            Sua vaga em <strong>{event.title}</strong> ({shortDate(event.startsAt)}) foi liberada. Obrigado por avisar — isso ajuda outra família a vir.
          </p>
        </div>
        <Button to="/agenda" variant="applique">
          Ver a agenda
        </Button>
        <Elsewhere eventId={event.id} />
      </div>
    </Container>
  )
}
