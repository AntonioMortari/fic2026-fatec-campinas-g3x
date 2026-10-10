import { Link } from 'react-router-dom'
import { eventMeta } from '../../lib/events'
import type { EventSummary } from '../../types/event'
import { DateBadge } from '../ui'

export function NextActivity({ event }: { event: EventSummary }) {
  return (
    <section aria-labelledby="next-activity-title" className="flex flex-col gap-3 desktop:gap-3.5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="next-activity-title" className="m-0 text-h2 font-bold desktop:text-h2-desktop">
          Próxima atividade
        </h2>
        <Link to="/agenda" className="inline-flex min-h-11 items-center text-small font-semibold desktop:text-[0.9375rem]">
          Agenda →
        </Link>
      </div>
      <article className="flex gap-3.5 border-[1.5px] border-brown bg-card p-3.5 desktop:gap-4.5 desktop:p-4.5">
        <DateBadge date={new Date(event.startsAt)} highlight size="next" />
        <div className="flex min-w-0 flex-col gap-1">
          {event.category && (
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-blue-deep">{event.category}</span>
          )}
          <h3 className="m-0 text-item font-bold desktop:text-[1.375rem]">{event.title}</h3>
          <span className="text-small text-brown-400 desktop:text-[0.9375rem]">{eventMeta(event, { withCapacity: event.spotsLeft !== 0 })}</span>
          {event.spotsLeft === 0 ? (
            <span className="mt-1.5 inline-flex min-h-11 items-center font-semibold text-brown-400">Vagas esgotadas</span>
          ) : (
            <Link to={`/agenda/${event.id}/inscricao`} className="mt-1.5 inline-flex min-h-11 items-center text-[0.9375rem] font-semibold desktop:text-base">
              Quero me inscrever
            </Link>
          )}
        </div>
      </article>
    </section>
  )
}
