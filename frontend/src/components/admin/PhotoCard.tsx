import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { ADMIN_GALLERY_PATH, adminGalleryEditPath, numericDate } from '../../lib/gallery'
import { useAdminPhotoImage } from '../../services/gallery'
import type { AdminPhoto } from '../../types/gallery'
import { Skeleton } from '../ui'
import { BlobImage } from './BlobImage'
import { PhotoStateChip } from './PhotoStateChip'

interface PhotoCardProps {
  photo: AdminPhoto
  desktop: boolean
  busy: boolean
  selected?: boolean
  onPublication: () => void
}

const ACTION = 'inline-flex min-h-11 cursor-pointer items-center justify-center text-[0.875rem] font-semibold no-underline'

export function PhotoCard({ photo, desktop, busy, selected = false, onPublication }: PhotoCardProps) {
  const image = useAdminPhotoImage(photo.imageUrl)
  const unauthorized = photo.state === 'unauthorized'
  const missing = image.isError
  const name = `${photo.album}, ${photo.alt}`

  return (
    <li
      aria-current={selected ? 'true' : undefined}
      className={cn(
        'grid grid-cols-[6rem_minmax(0,1fr)] gap-x-3 gap-y-3 border-t border-line py-3.5',
        'desktop:flex desktop:flex-col desktop:gap-0 desktop:border desktop:bg-card desktop:p-0',
        unauthorized ? 'desktop:border-error' : selected ? 'desktop:border-brown desktop:ring-2 desktop:ring-brown' : 'desktop:border-brown/25',
      )}
    >
      {image.data ? (
        <BlobImage blob={image.data} className={cn('block size-24 object-cover desktop:aspect-[4/3] desktop:size-auto desktop:w-full', unauthorized && 'opacity-45')} />
      ) : missing ? (
        <div
          className="grid size-24 place-items-center bg-[repeating-linear-gradient(45deg,var(--color-cream-dark)_0_8px,#e4d8c4_8px_16px)] p-1.5 text-center text-[0.6875rem] leading-[1.3] font-semibold text-brown-600 desktop:flex desktop:aspect-[4/3] desktop:size-auto desktop:items-center desktop:p-3.5 desktop:text-left desktop:text-[0.8125rem] desktop:leading-[1.45]"
        >
          {desktop
            ? 'Não deu para carregar esta foto agora — o arquivo pode não estar mais guardado. Se o arquivo sumiu, “Apagar” limpa a lista.'
            : 'Arquivo não carregou'}
        </div>
      ) : (
        <Skeleton className="size-24 desktop:aspect-[4/3] desktop:size-auto desktop:w-full" />
      )}

      <div className="flex min-w-0 flex-col gap-1.25 desktop:flex-1 desktop:gap-1.5 desktop:px-3.5 desktop:py-3">
        <PhotoStateChip state={photo.state} />
        <span className="text-[0.9375rem] leading-[1.3] font-bold desktop:text-[0.96875rem]">{photo.album}</span>
        <span className="text-[0.8125rem] leading-[1.4] text-brown-600 desktop:leading-[1.45]">
          {desktop && <strong>Descrição: </strong>}
          {photo.alt}
        </span>
        {desktop && <span className="text-[0.78125rem] font-semibold text-brown-400">Enviada em {numericDate(photo.uploadedAt)}</span>}
        {unauthorized && (
          <span className="text-[0.78125rem] leading-[1.4] font-semibold text-error desktop:text-[0.8125rem] desktop:leading-[1.45]">
            {desktop
              ? 'Esta foto não pode ir ao ar: a autorização de uso de imagem não foi declarada quando ela subiu. Suba de novo marcando a caixa, ou apague esta.'
              : 'Não pode ir ao ar: sem autorização declarada.'}
          </span>
        )}
      </div>

      <div className="col-span-2 flex flex-wrap gap-2 desktop:col-span-1 desktop:grid desktop:auto-cols-fr desktop:grid-flow-col desktop:gap-0 desktop:border-t desktop:border-brown/20">
        {!unauthorized && (
          <button
            type="button"
            disabled={busy}
            onClick={onPublication}
            className={cn(
              ACTION,
              'basis-26 flex-1 border-[1.5px] border-brown desktop:border-0 desktop:border-r desktop:border-brown/20',
              photo.state === 'stored' ? 'bg-brown text-cream hover:text-cream' : 'bg-transparent text-brown',
            )}
          >
            {photo.state === 'live' ? 'Tirar do ar' : 'Publicar'} <span className="sr-only">{name}</span>
          </button>
        )}
        <Link
          to={adminGalleryEditPath(photo.id)}
          className={cn(ACTION, 'basis-26 flex-1 border-[1.5px] border-brown text-brown desktop:border-0 desktop:border-r desktop:border-brown/20')}
        >
          Editar <span className="sr-only">{name}</span>
        </Link>
        <Link to={`${ADMIN_GALLERY_PATH}/${photo.id}/apagar`} className={cn(ACTION, 'basis-26 flex-1 border-[1.5px] border-error text-error hover:text-error desktop:border-0')}>
          Apagar <span className="sr-only">{name}</span>
        </Link>
      </div>
    </li>
  )
}
