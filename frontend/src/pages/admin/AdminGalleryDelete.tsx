import { useNavigate, useParams } from 'react-router-dom'
import { AdminBackBar } from '../../components/admin/AdminBackBar'
import { AdminPage } from '../../components/admin/AdminPage'
import { BlobImage } from '../../components/admin/BlobImage'
import { Button, EmptyState, LoadingState, Skeleton } from '../../components/ui'
import { parseApiError } from '../../lib/api-error'
import { ADMIN_GALLERY_PATH, numericDate, STATE_LABELS } from '../../lib/gallery'
import { useAdminPhoto, useAdminPhotoImage, useDeletePhoto } from '../../services/gallery'
import type { AdminPhoto } from '../../types/gallery'

function Confirmation({ photo }: { photo: AdminPhoto }) {
  const navigate = useNavigate()
  const remove = useDeletePhoto()
  const image = useAdminPhotoImage(photo.imageUrl)

  function confirm() {
    remove.mutate(photo.id, { onSuccess: () => void navigate(ADMIN_GALLERY_PATH, { replace: true, state: { notice: 'deleted' } }) })
  }

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <h1 className="m-0 text-[1.75rem] leading-[1.15] font-bold desktop:text-[2.125rem]">Apagar esta foto?</h1>
      {image.data ? (
        <BlobImage blob={image.data} className="block aspect-[4/3] w-full object-cover" />
      ) : image.isError ? null : (
        <Skeleton className="aspect-[4/3] w-full" />
      )}
      <div className="flex flex-col gap-1">
        <span className="text-[1.0625rem] font-bold">{photo.album}</span>
        <span className="text-small leading-[1.45] text-brown-600">{photo.alt}</span>
        <span className="text-[0.8125rem] font-semibold text-brown-400">
          {STATE_LABELS[photo.state]} · enviada em {numericDate(photo.uploadedAt)}
        </span>
      </div>
      <div className="border-2 border-error bg-card p-3.5 text-[0.9375rem] leading-[1.55]">
        <strong className="text-error">Não dá para desfazer.</strong> A foto sai do site e o arquivo é removido na mesma hora — todo link que já circulou para de abrir. Use quando a autorização foi retirada ou a foto subiu por
        engano.
      </div>
      {remove.isError && (
        <p role="alert" className="m-0 border-[1.5px] border-error bg-error-tint px-3.5 py-2.5 text-[0.9375rem] font-bold">
          {parseApiError(remove.error).message}
        </p>
      )}
      <button
        type="button"
        onClick={confirm}
        disabled={remove.isPending}
        className="min-h-13 cursor-pointer border-[1.5px] border-error bg-error px-5 text-[1rem] font-semibold text-card disabled:cursor-not-allowed disabled:opacity-60"
      >
        {remove.isPending ? 'Apagando…' : 'Apagar de vez'}
      </button>
      <Button to={ADMIN_GALLERY_PATH} variant="secondary" className="min-h-13 text-[1rem]">
        Voltar sem apagar
      </Button>
    </div>
  )
}

export function AdminGalleryDelete() {
  const { id } = useParams()
  const photo = useAdminPhoto(id)

  return (
    <>
      <AdminBackBar to={ADMIN_GALLERY_PATH} label="Galeria" />
      <AdminPage className="pt-5 desktop:pt-9">
        {photo.isPending && <LoadingState label="Carregando a foto…" shape="block" count={2} />}
        {photo.isError && (
          <EmptyState
            tone={parseApiError(photo.error).code === 'photo_not_found' ? 'neutral' : 'error'}
            title={parseApiError(photo.error).code === 'photo_not_found' ? 'Não encontramos essa foto' : 'Não conseguimos carregar a foto'}
            text="Ela pode já ter sido apagada. Volte para a galeria e confira."
            actions={
              <Button to={ADMIN_GALLERY_PATH} variant="secondary" size="compact">
                Voltar para a galeria
              </Button>
            }
          />
        )}
        {photo.data && <Confirmation photo={photo.data} />}
      </AdminPage>
    </>
  )
}
