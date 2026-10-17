import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { ADMIN_FAQ_PATH } from '../../lib/faq'
import type { AdminFaq } from '../../types/faq'
import { FaqStatusChip } from './FaqStatusChip'

interface FaqAdminListProps {
  data: AdminFaq
  selectedId?: string
  moving: boolean
  onMove: (id: string, direction: 'up' | 'down') => void
}

const ARROW = 'grid size-11 cursor-pointer place-items-center border-[1.5px] border-brown bg-transparent text-base font-bold text-brown disabled:cursor-not-allowed disabled:opacity-30'

// Designs 18d and 18e: the questions grouped by theme, in the order of the public page. The arrows are desktop only (18e has none: dragging
// and tiny arrows are hard on a phone, and the order is a desk job).
export function FaqAdminList({ data, selectedId, moving, onMove }: FaqAdminListProps) {
  const sourceLabel = (id: string) => data.options.sources.find((source) => source.id === id)?.label ?? id

  return (
    <div className="flex flex-col gap-6">
      {data.themes.map((theme) => {
        const items = data.items.filter((item) => item.themeId === theme.id)
        return (
          <section key={theme.id} aria-labelledby={`faq-admin-${theme.id}`} className="flex flex-col">
            <h2 id={`faq-admin-${theme.id}`} className="m-0 pb-2 text-overline font-bold uppercase tracking-[0.12em] text-ochre-deep">
              {theme.name}
              {!theme.published && <span> · tema fora do ar</span>}
            </h2>
            {items.length === 0 && <p className="m-0 border-t border-line py-3 text-small text-brown-400">Nenhuma pergunta neste tema.</p>}
            <ul className="m-0 flex list-none flex-col p-0">
              {items.map((item, index) => (
                <li
                  key={item.id}
                  aria-current={item.id === selectedId ? 'true' : undefined}
                  className={cn(
                    'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-t border-line py-2 desktop:grid-cols-[minmax(0,1fr)_auto_auto] desktop:py-1.5 desktop:pl-1',
                    item.id === selectedId && 'desktop:border-[1.5px] desktop:border-l-4 desktop:border-brown desktop:bg-card desktop:pl-4',
                  )}
                >
                  <Link to={`${ADMIN_FAQ_PATH}/${item.id}/editar`} className="flex min-h-11 min-w-0 flex-col justify-center gap-0.5 py-1 text-brown no-underline">
                    <span className="text-[0.96875rem] leading-[1.3] font-bold">{item.question}</span>
                    <span className="hidden text-[0.78125rem] text-brown-400 desktop:block">Texto de: {sourceLabel(item.source)}</span>
                  </Link>
                  <FaqStatusChip published={item.published} />
                  <span className="hidden gap-1 desktop:flex">
                    <button type="button" aria-label={`Subir: ${item.question}`} disabled={index === 0 || moving} onClick={() => onMove(item.id, 'up')} className={ARROW}>
                      <span aria-hidden="true">↑</span>
                    </button>
                    <button type="button" aria-label={`Descer: ${item.question}`} disabled={index === items.length - 1 || moving} onClick={() => onMove(item.id, 'down')} className={ARROW}>
                      <span aria-hidden="true">↓</span>
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
