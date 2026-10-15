import { cn } from '../../lib/cn'
import { ADMIN_NEWS_PATH, KIND_LABELS, numericDate } from '../../lib/news'
import { useAdminNewsImage } from '../../services/admin-news'
import type { AdminNews } from '../../types/admin-news'
import { Button } from '../ui'
import { NewsStatusChip } from './NewsStatusChip'
import { useObjectUrl } from './use-object-url'

interface AdminNewsRowProps {
  news: AdminNews
  selected: boolean
  busy: boolean
  onPublication: () => void
}

export function AdminNewsRow({ news, selected, busy, onPublication }: AdminNewsRowProps) {
  const image = useObjectUrl(useAdminNewsImage(news.image?.url).data)
  const edit = `${ADMIN_NEWS_PATH}/${news.id}/editar`

  return (
    <li
      aria-current={selected ? 'true' : undefined}
      className={cn(
        'grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 border-b border-line px-0 py-3.5 desktop:grid-cols-[4.5rem_minmax(0,1fr)_auto] desktop:pr-4 desktop:pl-5',
        selected && 'desktop:border-[1.5px] desktop:border-l-4 desktop:border-brown desktop:bg-card desktop:pl-4!',
      )}
    >
      {image ? (
        <img src={image} alt="" className="block h-13.5 w-18 object-cover" />
      ) : (
        <span className="grid h-13.5 w-18 place-items-center bg-[#e4d8c4] text-[0.6875rem] font-semibold text-brown-400">sem imagem</span>
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <NewsStatusChip published={news.published} />
          <span className="text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-brown-400">{KIND_LABELS[news.kind]}</span>
        </div>
        <span className="text-[1rem] leading-[1.3] font-bold">{news.title}</span>
        <span className="text-[0.78125rem] font-semibold text-brown-400">Escrita em {numericDate(news.createdAt)}</span>
      </div>
      <div className="col-span-2 grid grid-cols-2 gap-2 desktop:col-span-1 desktop:flex">
        <Button to={edit} variant="secondary" size="compact" className="min-h-11 px-3.5">
          Editar <span className="sr-only">{news.title}</span>
        </Button>
        <Button variant={news.published ? 'secondary' : 'primary'} size="compact" className="min-h-11 px-3.5" disabled={busy} onClick={onPublication}>
          {news.published ? 'Tirar do ar' : 'Publicar'} <span className="sr-only">{news.title}</span>
        </Button>
      </div>
    </li>
  )
}
