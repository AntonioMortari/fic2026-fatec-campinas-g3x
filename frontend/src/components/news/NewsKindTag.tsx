import { cn } from '../../lib/cn'
import { KIND_LABELS } from '../../lib/news'
import type { NewsKind } from '../../types/news'

export function NewsKindTag({ kind }: { kind: NewsKind }) {
  return (
    <span
      className={cn(
        'border-[1.5px] border-brown px-2 py-0.5 text-[0.71875rem] font-bold uppercase tracking-[0.06em] text-brown',
        kind === 'campaign' ? 'bg-ochre' : 'bg-transparent',
      )}
    >
      {KIND_LABELS[kind]}
    </span>
  )
}
