import { cn } from '../../lib/cn'

export function FaqStatusChip({ published }: { published: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border-[1.5px] px-2 py-0.5 text-[0.71875rem] leading-[1.2] font-bold',
        published ? 'border-brown bg-brown text-cream' : 'border-dashed border-brown bg-transparent text-brown',
      )}
    >
      {published ? 'No ar' : 'Fora do ar'}
    </span>
  )
}
