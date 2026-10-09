import { cn } from '../../lib/cn'
import { eventMeta } from '../../lib/events'
import type { AdminEvent } from '../../types/admin-event'
import { Button, Card, DateBadge } from '../ui'

interface AdminEventCardProps {
  event: AdminEvent
  busy: boolean
  onPublication: (published: boolean) => void
}

export function AdminEventCard({ event, busy, onPublication }: AdminEventCardProps) {
  return (
    <Card as="li" className="flex flex-col gap-3 p-4">
      <div className="flex min-w-0 gap-3.5">
        <DateBadge date={new Date(event.startsAt)} highlight={event.published} />
        <div className="flex min-w-0 flex-col gap-1">
          <span
            className={cn(
              'self-start border-[1.5px] border-brown px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-[0.1em]',
              event.published ? 'bg-brown text-cream' : 'bg-transparent text-brown',
            )}
          >
            {event.published ? 'Publicado' : 'Rascunho'}
          </span>
          <h3 className="m-0 text-h3 leading-tight font-bold">{event.title}</h3>
          <p className="m-0 text-small text-brown-400">
            {eventMeta(event)} · {event.registrationCount === 1 ? '1 inscrição' : `${event.registrationCount} inscrições`}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button to={`/admin/eventos/${event.id}/editar`} variant="secondary" size="compact" className="min-h-12">
          Editar <span className="sr-only">{event.title}</span>
        </Button>
        <Button
          variant={event.published ? 'secondary' : 'primary'}
          size="compact"
          className="min-h-12"
          disabled={busy}
          onClick={() => onPublication(!event.published)}
        >
          {event.published ? 'Tirar do ar' : 'Publicar'} <span className="sr-only">{event.title}</span>
        </Button>
        <Button to={`/admin/eventos/${event.id}/inscritos`} variant="secondary" size="compact" className="min-h-12">
          Ver inscritos ({event.registrationCount}) <span className="sr-only">de {event.title}</span>
        </Button>
        <Button to={`/admin/eventos/${event.id}/presenca`} variant="secondary" size="compact" className="min-h-12">
          Lista de presença <span className="sr-only">de {event.title}</span>
        </Button>
      </div>
    </Card>
  )
}
