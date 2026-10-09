import { AdminEventCard } from '../../components/admin/AdminEventCard'
import { BackLink, Button, Container, EmptyState, PageHeader, useToast } from '../../components/ui'
import { useAdminEvents, useSetPublication } from '../../services/admin-events'
import type { AdminEvent } from '../../types/admin-event'

function Section({ title, events, busyId, onPublication }: {
  title: string
  events: AdminEvent[]
  busyId: string | null
  onPublication: (event: AdminEvent, published: boolean) => void
}) {
  if (events.length === 0) return null
  return (
    <section aria-labelledby={`section-${title}`} className="flex flex-col gap-3">
      <h2 id={`section-${title}`} className="m-0 text-overline font-semibold uppercase tracking-[0.12em] text-brown-400">
        {title} ({events.length})
      </h2>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {events.map((event) => (
          <AdminEventCard key={event.id} event={event} busy={busyId === event.id} onPublication={(published) => onPublication(event, published)} />
        ))}
      </ul>
    </section>
  )
}

export function AdminEvents() {
  const { data: events, isPending, isError, refetch } = useAdminEvents()
  const publication = useSetPublication()
  const toast = useToast()

  function change(event: AdminEvent, published: boolean) {
    publication.mutate(
      { id: event.id, published },
      {
        onSuccess: () =>
          toast(published ? 'Publicado. Já aparece na agenda.' : 'Tirado do ar. Não aparece mais na agenda.', {
            action: { label: 'Desfazer', onClick: () => change(event, !published) },
          }),
        onError: () => toast('Não foi possível mudar agora. Tente de novo.', { tone: 'error' }),
      },
    )
  }

  const busyId = publication.isPending ? (publication.variables?.id ?? null) : null
  const drafts = events?.filter((event) => !event.published) ?? []
  const published = events?.filter((event) => event.published) ?? []

  return (
    <Container className="pb-12">
      <div className="pt-2">
        <BackLink to="/admin" label="Painel da equipe" />
      </div>
      <PageHeader
        overline="Equipe"
        title="Eventos"
        lead="Salvar não publica: publique pelo botão de cada evento. Eventos não são apagados, porque isso levaria junto a lista de inscritos."
        action={
          <Button to="/admin/eventos/novo" variant="applique">
            Novo evento
          </Button>
        }
      />

      <div className="flex max-w-xl flex-col gap-6">
        {isPending && <p role="status" className="m-0">Carregando os eventos…</p>}
        {isError && (
          <EmptyState
            tone="error"
            title="Não conseguimos carregar os eventos"
            text="Tente de novo em alguns minutos."
            actions={
              <Button variant="secondary" size="compact" onClick={() => void refetch()}>
                Tentar de novo
              </Button>
            }
          />
        )}
        {events?.length === 0 && <EmptyState title="Nenhum evento ainda" text="Cadastre o primeiro em “Novo evento”." />}
        <Section title="Rascunhos" events={drafts} busyId={busyId} onPublication={change} />
        <Section title="Publicados" events={published} busyId={busyId} onPublication={change} />
      </div>
    </Container>
  )
}
