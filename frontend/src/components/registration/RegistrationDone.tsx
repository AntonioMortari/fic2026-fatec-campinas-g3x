import { calendarUrl } from '../../services/events'
import type { EventDetail } from '../../types/event'
import { Button, PageHeader } from '../ui'
import { EventSummaryCard } from './EventSummaryCard'

interface RegistrationDoneProps {
  event: EventDetail
  name: string
  onAnother: () => void
}

export function RegistrationDone({ event, name, onAnother }: RegistrationDoneProps) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Inscrição registrada" lead={<>Guardamos o lugar de <strong>{name}</strong> nesta atividade.</>} className="pt-0" />
      <EventSummaryCard event={event} />
      <div className="flex flex-col gap-2.5">
        <Button href={calendarUrl(event.id)} variant="secondary">
          + Agenda <span className="sr-only">: adicionar {event.title} ao calendário</span>
        </Button>
        <Button variant="secondary" onClick={onAnother}>
          Inscrever outra pessoa
        </Button>
        <Button to="/agenda">Voltar para a agenda</Button>
      </div>
    </div>
  )
}
