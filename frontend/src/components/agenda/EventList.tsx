import { groupByMonth } from '../../lib/events'
import type { EventSummary } from '../../types/event'
import { EventCard } from './EventCard'

interface EventListProps {
  events: EventSummary[]
  period: 'upcoming' | 'past'
  nextEventId?: string
}

export function EventList({ events, period, nextEventId }: EventListProps) {
  const groups = groupByMonth(events)

  return (
    <div className="flex flex-col gap-7">
      {groups.map((group, groupIndex) => (
        <section key={group.key} aria-labelledby={`month-${group.key}`} className="flex flex-col gap-3.5">
          <h2 id={`month-${group.key}`} className="m-0 text-overline font-semibold uppercase tracking-[0.12em] text-brown-400 desktop:text-[0.8125rem]">
            {group.heading}
          </h2>
          <div className="flex flex-col gap-3.5">
            {group.events.map((event, index) => {
              const isFeatured = period === 'upcoming' && groupIndex === 0 && index === 0
              return (
                <EventCard
                  key={event.id}
                  event={event}
                  variant={period === 'past' ? 'past' : isFeatured ? 'featured' : 'row'}
                  isNext={isFeatured && event.id === nextEventId}
                />
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
