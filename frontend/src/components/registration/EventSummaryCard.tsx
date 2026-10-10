import { eventMeta } from '../../lib/events'
import type { EventSummary } from '../../types/event'
import { Card, DateBadge } from '../ui'

export function EventSummaryCard({ event, showSpots = true }: { event: EventSummary; showSpots?: boolean }) {
  return (
    <Card as="section" aria-label="A atividade" className="flex items-center gap-3 p-3">
      <DateBadge date={new Date(event.startsAt)} highlight size="compact" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="m-0 text-base leading-[1.2] font-bold">{event.title}</h2>
        <p className="m-0 text-[0.84375rem] leading-[1.25] text-brown-400">{eventMeta(event, { withCapacity: showSpots })}</p>
      </div>
    </Card>
  )
}
