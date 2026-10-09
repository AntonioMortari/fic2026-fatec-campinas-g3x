import { Link } from 'react-router-dom'
import { calendarUrl } from '../../services/events'
import type { EventDetail } from '../../types/event'
import { Button, PageHeader } from '../ui'
import { EventSummaryCard } from './EventSummaryCard'

interface RegistrationDoneProps {
  event: EventDetail
  name: string
  cancelCode: string
  onAnother: () => void
}

export function RegistrationDone({ event, name, cancelCode, onAnother }: RegistrationDoneProps) {
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
      <p className="m-0 text-small text-brown-600">
        Precisa desistir?{' '}
        <Link to={`/inscricao/cancelar?c=${cancelCode}`}>
          Cancelar esta inscrição <span className="sr-only">de {name}</span>
        </Link>
      </p>
    </div>
  )
}
