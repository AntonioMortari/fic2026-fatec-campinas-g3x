import { cn } from '../../lib/cn'
import type { BadgeTone } from '../../lib/event-detail'

const TONES: Record<BadgeTone, string> = {
  ochre: 'bg-ochre text-brown',
  card: 'bg-card text-error',
  muted: 'bg-cream-dark text-brown',
}

export function EventBadge({ label, tone, className }: { label: string; tone: BadgeTone; className?: string }) {
  return (
    <span className={cn('inline-block self-start border-[1.5px] border-brown px-2.5 py-[0.1875rem] text-[0.75rem] font-bold uppercase tracking-[0.06em] desktop:text-[0.78125rem]', TONES[tone], className)}>
      {label}
    </span>
  )
}
