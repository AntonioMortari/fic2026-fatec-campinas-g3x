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
  return <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-blue-deep desktop:text-xs">{text}</span>
}

function SoldOut({ className }: { className?: string }) {
  return <span className={cn('inline-flex min-h-11 items-center font-semibold text-brown-400', className)}>Vagas esgotadas</span>
}

function RegisterLink({ event, className }: { event: EventSummary; className?: string }) {
  if (event.spotsLeft === 0) return <SoldOut />
  return (
    <Link to={`/agenda/${event.id}/inscricao`} className={className}>
      Inscrever <span className="sr-only">em {event.title}</span>
    </Link>
  )
}

export function EventCard({ event, variant, isNext = false }: EventCardProps) {
  if (variant === 'featured') {
    const soldOut = event.spotsLeft === 0
    return (
      <Card
        elevation="applique"
        as="article"
        className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3.5 gap-y-3.5 p-4 desktop:gap-x-5.5 desktop:gap-y-0 desktop:border desktop:p-7 desktop:shadow-[6px_6px_0_var(--color-brown)]"
      >
        <div className="col-start-1 row-start-1 desktop:row-span-2">
          <DateBadge date={new Date(event.startsAt)} highlight size="feature" />
        </div>
        <div className="col-start-2 row-start-1 flex min-w-0 flex-col gap-1 desktop:gap-1.5">
          <Category event={event} isNext={isNext} />
          <h3 className="m-0 text-h3 leading-tight font-bold desktop:text-[1.875rem] desktop:leading-[1.15]">{event.title}</h3>
          <p className="m-0 text-small text-brown-400 desktop:text-body">{eventMeta(event, { withCapacity: !soldOut })}</p>
          {event.description && <p className="m-0 mt-1.5 hidden text-body leading-[1.55] text-brown-600 desktop:block">{event.description}</p>}
        </div>
        <div className="col-span-2 col-start-1 row-start-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2 desktop:col-span-1 desktop:col-start-2 desktop:flex desktop:gap-3 desktop:pt-3.5">
          {soldOut ? (
            <SoldOut className="px-2" />
          ) : (
            <Button to={`/agenda/${event.id}/inscricao`} size="compact" className="min-h-12 desktop:min-h-12.5 desktop:px-6 desktop:text-body">
              Quero me inscrever <span className="sr-only">em {event.title}</span>
            </Button>
          )}
          <Button href={calendarUrl(event.id)} variant="secondary" size="compact" className="min-h-12 desktop:min-h-12.5 desktop:px-4.75 desktop:text-[0.9375rem]">
            + Agenda <span className="sr-only">: adicionar {event.title} ao calendário</span>
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card as="article" className="flex flex-col gap-3 p-4 desktop:flex-row desktop:items-center desktop:gap-6 desktop:px-6 desktop:py-5">
      <div className="flex min-w-0 flex-1 gap-3.5 desktop:gap-5.5">
        <DateBadge date={new Date(event.startsAt)} size="row" />
        <div className="flex min-w-0 flex-col gap-1">
          <Category event={event} isNext={false} />
          <h3 className="m-0 text-h3 leading-tight font-bold desktop:text-[1.375rem]">{event.title}</h3>
          <p className="m-0 text-small text-brown-400 desktop:text-[0.9375rem]">{eventMeta(event, { withCapacity: variant === 'row' && event.spotsLeft !== 0 })}</p>
        </div>
      </div>
      {variant === 'row' && (
        <RegisterLink
          event={event}
          className={cn(
            'inline-flex min-h-11 items-center font-semibold underline',
            'desktop:min-h-11.5 desktop:min-w-26 desktop:justify-center desktop:border desktop:border-brown desktop:px-4.5 desktop:text-[0.9375rem] desktop:text-brown desktop:no-underline',
          )}
        />
      )}
    </Card>
  )
}
