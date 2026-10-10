import { useNavigate, useParams } from 'react-router-dom'
import { EventForm } from '../../components/admin/EventForm'
import { isMissingEvent } from '../../lib/api-error'
import { AdminPage } from '../../components/admin/AdminPage'
import { BackLink, Button, EmptyState, useToast } from '../../components/ui'
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
    if (isMissingEvent(existing.error)) return <NotFound />
  }

  const header = (
    <div className="flex flex-col gap-1">
      <div className="max-desktop:hidden">
        <BackLink to="/admin/eventos" label="Eventos e presença" tone="link" />
      </div>
      <h1 className="m-0 sr-only text-[2.125rem] leading-[1.2] font-bold desktop:not-sr-only">{id ? 'Editar evento' : 'Novo evento'}</h1>
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
    </div>
  )

  if (id && !existing.data) return <AdminPage className="desktop:max-w-[51rem]">{header}</AdminPage>

  return <EventForm key={existing.data?.id ?? 'new'} event={existing.data} saving={save.isPending} onSubmit={handleSubmit} header={header} />
}
