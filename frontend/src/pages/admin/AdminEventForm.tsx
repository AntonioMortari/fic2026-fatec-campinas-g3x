import { useNavigate, useParams } from 'react-router-dom'
import { EventForm } from '../../components/admin/EventForm'
import { BackLink, Button, Container, EmptyState, PageHeader, useToast } from '../../components/ui'
import { useAdminEvent, useSaveEvent } from '../../services/admin-events'
import type { EventInput } from '../../types/admin-event'
import { NotFound } from '../NotFound'

export function AdminEventForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const existing = useAdminEvent(id)
  const save = useSaveEvent(id)

  function handleSubmit(input: EventInput, onError: (error: unknown) => void) {
    save.mutate(input, {
      onSuccess: (event) => {
        toast(
          id
            ? event.published
              ? 'Alterações salvas. O evento continua publicado.'
              : 'Alterações salvas. O evento continua em rascunho.'
            : 'Rascunho salvo. Publique quando estiver pronto.',
        )
        void navigate('/admin/eventos')
      },
      onError,
    })
  }

  if (id && existing.isError) {
    const missing = (existing.error as { response?: { status?: number } }).response?.status === 404
    if (missing) return <NotFound />
  }

  return (
    <Container className="pb-32 desktop:pb-12">
      <div className="pt-2">
        <BackLink to="/admin/eventos" label="Eventos" />
      </div>
      <PageHeader overline="Equipe" title={id ? 'Editar evento' : 'Novo evento'} />
      {id && existing.isPending && <p role="status" className="m-0">Carregando o evento…</p>}
      {id && existing.isError && (
        <EmptyState
          tone="error"
          title="Não conseguimos carregar o evento"
          text="Tente de novo em alguns minutos."
          actions={
            <Button variant="secondary" size="compact" onClick={() => void existing.refetch()}>
              Tentar de novo
            </Button>
          }
        />
      )}
      {(!id || existing.data) && <EventForm key={existing.data?.id ?? 'new'} event={existing.data} saving={save.isPending} onSubmit={handleSubmit} />}
    </Container>
  )
}
