import { cn } from '../../lib/cn'
import { CONTACTS } from '../../lib/contacts'
import { describeRegistration } from '../../lib/event-detail'
import { calendarUrl } from '../../services/events'
import type { EventDetail } from '../../types/event'
import { Button } from '../ui'

type Placement = 'bar' | 'card'

export function EventActions({ event, placement }: { event: EventDetail; placement: Placement }) {
  const view = describeRegistration(event)
  if (!view.action) return null
  const bar = placement === 'bar'

  const primaryClass = cn('w-full', bar ? 'min-h-13' : 'min-h-13')
  const primary =
    view.action.kind === 'register' ? (
      <Button to={`/agenda/${event.id}/inscricao`} variant="applique" className={primaryClass}>
        {view.action.label}
      </Button>
    ) : view.action.kind === 'whatsapp' ? (
      <Button href={CONTACTS.whatsapp} target="_blank" rel="noreferrer" variant="applique" className={primaryClass}>
        {view.action.label}
      </Button>
    ) : (
      <Button href={calendarUrl(event.id)} variant="applique" className={primaryClass}>
        {view.action.label}
      </Button>
    )

  const calendar = view.showCalendar && (
    <Button href={calendarUrl(event.id)} variant="secondary" className={bar ? 'min-h-13 px-3.5 text-[0.9375rem]' : 'min-h-12 w-full text-[0.9375rem]'}>
      {bar ? '+ Agenda' : '+ Adicionar à minha agenda'}
    </Button>
  )

  return (
    <div className={cn('flex flex-col', bar ? 'gap-1.5' : 'gap-2.5')}>
      <div className={cn(bar ? 'flex flex-col gap-2.5 min-[24rem]:grid min-[24rem]:grid-cols-[minmax(0,1fr)_auto]' : 'flex flex-col gap-2.5')}>
        {primary}
        {calendar}
      </div>
      {view.note && <p className={cn('m-0 text-brown-600', bar ? 'text-center text-[0.8125rem] leading-[1.4]' : 'text-[0.84375rem] leading-[1.45]')}>{view.note}</p>}
    </div>
  )
}
