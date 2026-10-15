import { cn } from '../../lib/cn'
import { countByState, FILTER_LABELS, STATE_ORDER } from '../../lib/gallery'
import type { AdminPhoto, PhotoState } from '../../types/gallery'

interface GalleryFiltersProps {
  photos: AdminPhoto[] | undefined
  state: PhotoState | undefined
  onState: (state: PhotoState | undefined) => void
}

const CHIP = 'inline-flex min-h-11 flex-none cursor-pointer items-center rounded-full border-[1.5px] px-3.5 text-small font-semibold whitespace-nowrap desktop:min-h-9'

export function GalleryFilters({ photos, state, onState }: GalleryFiltersProps) {
  const counts = photos ? countByState(photos) : undefined
  const options: { value: PhotoState | undefined; label: string }[] = [
    { value: undefined, label: 'Todas' },
    ...STATE_ORDER.map((value) => ({ value, label: counts ? `${FILTER_LABELS[value]} · ${counts[value]}` : FILTER_LABELS[value] })),
  ]

  return (
    <div role="group" aria-label="Situação" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 desktop:mx-0 desktop:flex-wrap desktop:overflow-visible desktop:px-0 desktop:pb-0">
      {options.map((option) => {
        const active = option.value === state
        const alert = option.value === 'unauthorized'
        return (
          <button
            key={option.value ?? 'all'}
            type="button"
            aria-pressed={active}
            onClick={() => onState(option.value)}
            className={cn(
              CHIP,
              alert ? 'border-error' : 'border-brown',
              active ? (alert ? 'bg-error text-cream' : 'bg-brown text-cream hover:bg-brown-800') : cn('bg-transparent hover:bg-hover', alert ? 'text-error' : 'text-brown'),
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
