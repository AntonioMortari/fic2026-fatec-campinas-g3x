import { dateParts } from '../../lib/dates'
import { formatTimeRange } from '../../lib/events'
import { useMyRegistrations } from '../../services/events'
import type { MyRegistration } from '../../types/my-registration'
import { Button, Card, EmptyState } from '../ui'

function RegistrationItem({ registration }: { registration: MyRegistration }) {
  const { event, name, attendanceRecorded } = registration
  const when = `${dateParts(new Date(event.startsAt)).spoken} · ${formatTimeRange(event)}`

  return (
    <Card as="li" className="flex flex-col gap-1 p-4">
      <h4 className="m-0 text-item leading-tight font-bold">{event.title}</h4>
      <p className="m-0 text-small text-brown-400">
        {when}
        {event.location && ` · ${event.location}`}
      </p>
      <p className="m-0 text-small">
        Em nome de <strong>{name}</strong>
        {' · '}
        {event.isOver ? (attendanceRecorded ? 'Presença registrada' : 'Atividade encerrada') : 'Inscrição registrada'}
      </p>
    </Card>
  )
}

function Group({ title, items }: { title: string; items: MyRegistration[] }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="m-0 text-overline font-semibold uppercase tracking-[0.12em] text-brown-400">
        {title} ({items.length})
      </h3>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {items.map((registration) => (
          <RegistrationItem key={registration.id} registration={registration} />
        ))}
      </ul>
    </div>
  )
}

export function MyRegistrations() {
  const { data, isPending, isError, refetch } = useMyRegistrations()
  const upcoming = data?.filter((registration) => !registration.event.isOver) ?? []
  const past = (data?.filter((registration) => registration.event.isOver) ?? []).reverse()

  return (
    <section aria-labelledby="my-registrations" className="flex flex-col gap-3">
      <h2 id="my-registrations" className="m-0 text-h2 font-bold">
        Minhas inscrições
      </h2>
      {isPending && <p role="status" className="m-0">Carregando suas inscrições…</p>}
      {isError && (
        <EmptyState
          tone="error"
          title="Não conseguimos carregar suas inscrições"
          text="Tente de novo em alguns minutos."
          actions={
            <Button variant="secondary" size="compact" onClick={() => void refetch()}>
              Tentar de novo
            </Button>
          }
        />
      )}
      {data?.length === 0 && (
        <EmptyState
          title="Nenhuma inscrição nesta conta ainda"
          text="Quando você se inscrever em uma atividade com a conta aberta, ela aparece aqui. Inscrições feitas sem entrar na conta não ficam ligadas a ela."
          actions={
            <Button to="/agenda" variant="secondary" size="compact">
              Ver a agenda
            </Button>
          }
        />
      )}
      <Group title="Próximas" items={upcoming} />
      <Group title="Já aconteceram" items={past} />
    </section>
  )
}
