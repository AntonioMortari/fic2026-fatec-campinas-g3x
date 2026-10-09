import { eventMeta } from '../../lib/events'
import type { EventSummary } from '../../types/event'
import { Card, DateBadge } from '../ui'

export function EventSummaryCard({ event, showSpots = true }: { event: EventSummary; showSpots?: boolean }) {
  return (
    <Card as="section" aria-label="A atividade" className="flex items-center gap-3.5 p-3.5">
      <DateBadge date={new Date(event.startsAt)} highlight />
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="m-0 text-item leading-tight font-bold">{event.title}</h2>
        <p className="m-0 text-small text-brown-400">{eventMeta(event, { withCapacity: showSpots })}</p>
      </div>
    </Card>
  )
}
