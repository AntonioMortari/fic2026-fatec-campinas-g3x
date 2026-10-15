import { useNavigate } from 'react-router-dom'
import { AdminBackBar } from '../../components/admin/AdminBackBar'
import { AdminPage } from '../../components/admin/AdminPage'
import { PhotoEditForm } from '../../components/admin/PhotoEditForm'
import { Button, EmptyState, LoadingState } from '../../components/ui'
import { parseApiError } from '../../lib/api-error'
import { ADMIN_GALLERY_PATH } from '../../lib/gallery'
import { useAdminPhoto } from '../../services/gallery'

export function PhotoNotFound({ error }: { error: unknown }) {
  const missing = parseApiError(error).code === 'photo_not_found'
  return (
    <EmptyState
      tone={missing ? 'neutral' : 'error'}
      title={missing ? 'Não encontramos essa foto' : 'Não conseguimos carregar a foto'}
      text="Ela pode já ter sido apagada. Volte para a galeria e confira."
      actions={
        <Button to={ADMIN_GALLERY_PATH} variant="secondary" size="compact">
          Voltar para a galeria
        </Button>
      }
    />
  )
}

// The phone's edit screen. On the desktop the same address is the gallery with the editor in its right column (AdminGallery).
export function AdminGalleryEdit({ id }: { id: string | undefined }) {
  const navigate = useNavigate()
  const photo = useAdminPhoto(id)

  return (
    <>
      <AdminBackBar to={ADMIN_GALLERY_PATH} label="Galeria" />
      <AdminPage className="pt-5">
        {photo.isPending && <LoadingState label="Carregando a foto…" shape="block" count={2} />}
        {photo.isError && <PhotoNotFound error={photo.error} />}
        {photo.data && <PhotoEditForm key={photo.data.id} photo={photo.data} desktop={false} onSaved={() => void navigate(ADMIN_GALLERY_PATH, { replace: true, state: { notice: 'edited' } })} />}
      </AdminPage>
    </>
  )
}
