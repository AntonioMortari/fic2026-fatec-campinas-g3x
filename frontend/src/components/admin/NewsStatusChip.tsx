import { cn } from '../../lib/cn'

export function NewsStatusChip({ published }: { published: boolean }) {
  return (
    <span
      className={cn(
        'rounded-full border-[1.5px] px-2 py-0.5 text-[0.71875rem] font-bold',
        published ? 'border-brown bg-brown text-cream' : 'border-brown-400/45 bg-transparent text-brown-600',
      )}
    >
      {published ? 'No ar' : 'Rascunho'}
    </span>
  )
}
