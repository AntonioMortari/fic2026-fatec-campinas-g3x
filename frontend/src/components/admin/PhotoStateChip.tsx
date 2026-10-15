import { cn } from '../../lib/cn'
import { STATE_LABELS } from '../../lib/gallery'
import type { PhotoState } from '../../types/gallery'

const TONES: Record<PhotoState, string> = {
  live: 'border-brown bg-brown text-cream',
  stored: 'border-brown/45 bg-transparent text-brown-600',
  unauthorized: 'border-error bg-card text-error',
}

export function PhotoStateChip({ state }: { state: PhotoState }) {
  return <span className={cn('self-start rounded-xl border-[1.5px] px-2 py-0.5 text-[0.71875rem] leading-[1.3] font-bold', TONES[state])}>{STATE_LABELS[state]}</span>
}
