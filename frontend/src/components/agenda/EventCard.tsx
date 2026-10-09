import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { eventMeta } from '../../lib/events'
import { calendarUrl } from '../../services/events'
import type { EventSummary } from '../../types/event'
import { Button, Card, DateBadge } from '../ui'

interface EventCardProps {
  event: EventSummary
  variant: 'featured' | 'row' | 'past'
  isNext?: boolean
}

function Category({ event, isNext }: { event: EventSummary; isNext: boolean }) {
  const text = [isNext ? 'Próxima' : null, event.category].filter(Boolean).join(' · ')
  if (!text) return null
  return <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-blue-deep">{text}</span>
}

function RegisterLink({ event, className }: { event: EventSummary; className?: string }) {
  return (
    <Link to={`/agenda/${event.id}/inscricao`} className={className}>
      Inscrever <span className="sr-only">em {event.title}</span>
    </Link>
  )
}

export function EventCard({ event, variant, isNext = false }: EventCardProps) {
  if (variant === 'featured') {
    return (
      <Card elevation="applique" as="article" className="flex min-w-0 flex-col desktop:flex-row">
        <div className="flex min-w-0 gap-3.5 p-4 desktop:flex-1 desktop:gap-6 desktop:p-7">
          <DateBadge date={new Date(event.startsAt)} highlight />
          <div className="flex min-w-0 flex-col gap-1 desktop:gap-1.5">
            <Category event={event} isNext={isNext} />
            <h3 className="m-0 text-h3 leading-tight font-bold desktop:text-[2rem]">{event.title}</h3>
            <p className="m-0 text-small text-brown-400 desktop:text-body">{eventMeta(event)}</p>
            {event.description && <p className="m-0 mt-1.5 hidden text-body text-brown-600 desktop:block">{event.description}</p>}
          </div>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2 px-4 pb-4 desktop:flex desktop:items-end desktop:px-7 desktop:pb-7">
          <Button to={`/agenda/${event.id}/inscricao`} size="compact" className="min-h-12 desktop:px-6">
            Quero me inscrever <span className="sr-only">em {event.title}</span>
          </Button>
          <Button href={calendarUrl(event.id)} variant="secondary" size="compact" className="min-h-12 desktop:px-5">
            + Agenda <span className="sr-only">: adicionar {event.title} ao calendário</span>
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card as="article" className="flex flex-col gap-3 p-4 desktop:flex-row desktop:items-center desktop:gap-6 desktop:px-6 desktop:py-5">
      <div className="flex min-w-0 flex-1 gap-3.5 desktop:gap-6">
        <DateBadge date={new Date(event.startsAt)} />
        <div className="flex min-w-0 flex-col gap-1">
          <Category event={event} isNext={false} />
          <h3 className="m-0 text-h3 leading-tight font-bold desktop:text-[1.375rem]">{event.title}</h3>
          <p className="m-0 text-small text-brown-400 desktop:text-[0.9375rem]">{eventMeta(event, { withCapacity: variant === 'row' })}</p>
        </div>
      </div>
      {variant === 'row' && (
        <RegisterLink
          event={event}
          className={cn(
            'inline-flex min-h-11 items-center font-semibold underline',
            'desktop:min-h-12 desktop:justify-center desktop:border-[1.5px] desktop:border-brown desktop:px-6 desktop:text-brown desktop:no-underline',
          )}
        />
      )}
    </Card>
  )
}
