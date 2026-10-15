import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { describeRegistration, whenLabel } from '../../lib/event-detail'
import type { EventDetail } from '../../types/event'

const ROW =
  'grid grid-cols-[6rem_minmax(0,1fr)] gap-3 border-b border-line py-3 ' +
  'desktop:flex desktop:flex-col desktop:gap-1 desktop:border-b-0 desktop:border-t desktop:py-3.5 desktop:first:border-t-0 desktop:first:pt-0 desktop:last:pb-0'

function Row({ label, children, className, bold = false }: { label: string; children: ReactNode; className?: string; bold?: boolean }) {
  return (
    <div className={ROW}>
      <dt className="text-small font-semibold text-brown-400 desktop:text-overline desktop:tracking-[0.1em] desktop:uppercase">{label}</dt>
      <dd className={cn('m-0 text-[1rem] leading-[1.4]', bold ? 'font-bold' : 'font-semibold', className)}>{children}</dd>
    </div>
  )
}

const SPOTS_TONE = { normal: '', alert: 'text-error', muted: 'text-brown-600' }

export function EventFacts({ event }: { event: EventDetail }) {
  const view = describeRegistration(event)

  return (
    <dl className="m-0 flex flex-col border-t-[1.5px] border-brown desktop:border-t-0">
      <Row label="Quando" bold className="desktop:text-[1.125rem]">
        {whenLabel(event)}
      </Row>
      {event.location && (
        <Row label="Onde" className="desktop:text-[1.0625rem]">
          {event.location}
        </Row>
      )}
      {event.ageRange && (
        <Row label="Para quem" className="desktop:text-[1.0625rem]">
          {event.ageRange}
        </Row>
      )}
      <Row label="Inscrição" className={cn('desktop:text-[1.0625rem] desktop:font-bold', SPOTS_TONE[view.spots.tone])}>
        {view.spots.text}
      </Row>
    </dl>
  )
}
