import { cn } from '../../lib/cn'
import { STAFF_FILTER_LABELS, STATUS_ORDER } from '../../lib/volunteering'
import type { StatusCounts, VolunteerArea, VolunteerStatus } from '../../types/volunteering'

interface VolunteerFiltersProps {
  status: VolunteerStatus | undefined
  area: string | undefined
  counts: StatusCounts | undefined
  areas: VolunteerArea[]
  onStatus: (status: VolunteerStatus | undefined) => void
  onArea: (area: string | undefined) => void
}

const CHIP = 'inline-flex min-h-11 flex-none cursor-pointer items-center rounded-full border px-3.5 text-small font-semibold desktop:min-h-9'

export function VolunteerFilters({ status, area, counts, areas, onStatus, onArea }: VolunteerFiltersProps) {
  const options: { value: VolunteerStatus | undefined; label: string }[] = [
    { value: undefined, label: 'Todas' },
    ...STATUS_ORDER.map((value) => ({ value, label: counts ? `${STAFF_FILTER_LABELS[value]} · ${counts[value]}` : STAFF_FILTER_LABELS[value] })),
  ]

  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label="Situação" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 desktop:mx-0 desktop:flex-wrap desktop:overflow-visible desktop:px-0 desktop:pb-0">
        {options.map((option) => {
          const active = option.value === status
          return (
            <button
              key={option.value ?? 'all'}
              type="button"
              aria-pressed={active}
              onClick={() => onStatus(option.value)}
              className={cn(CHIP, 'border-brown', active ? 'bg-brown text-cream hover:bg-brown-800' : 'bg-transparent text-brown hover:bg-hover')}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      <label className="relative inline-flex self-start">
        <span className="sr-only">Filtrar por área</span>
        <select
          value={area ?? ''}
          onChange={(event) => onArea(event.target.value || undefined)}
          className={cn(CHIP, 'field-sizing-content max-w-full appearance-none border-line-strong bg-transparent pr-9 text-brown-600')}
        >
          <option value="">Área: todas</option>
          {areas.map((entry) => (
            <option key={entry.id} value={entry.id}>
              Área: {entry.name}
            </option>
          ))}
        </select>
        <span aria-hidden="true" className="pointer-events-none absolute top-1/2 right-4 size-2 -translate-y-[65%] rotate-45 border-r-2 border-b-2 border-brown-600" />
      </label>
    </div>
  )
}
