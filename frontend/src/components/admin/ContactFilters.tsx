import { CONTACT_FILTER_LABELS, CONTACT_STATUS_ORDER } from '../../lib/contacts-admin'
import { cn } from '../../lib/cn'
import type { ContactCounts, ContactStatus } from '../../types/contacts'

interface ContactFiltersProps {
  status: ContactStatus | undefined
  counts: ContactCounts | undefined
  onStatus: (status: ContactStatus | undefined) => void
}

const CHIP = 'inline-flex min-h-11 flex-none cursor-pointer items-center rounded-full border border-brown px-3.5 text-small font-semibold desktop:min-h-9'

export function ContactFilters({ status, counts, onStatus }: ContactFiltersProps) {
  const options: { value: ContactStatus | undefined; label: string }[] = [
    { value: undefined, label: 'Todas' },
    ...CONTACT_STATUS_ORDER.map((value) => ({ value, label: counts ? `${CONTACT_FILTER_LABELS[value]} · ${counts[value]}` : CONTACT_FILTER_LABELS[value] })),
  ]

  return (
    <div role="group" aria-label="Situação" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 desktop:mx-0 desktop:flex-wrap desktop:overflow-visible desktop:px-0 desktop:pb-0">
      {options.map((option) => {
        const active = option.value === status
        return (
          <button
            key={option.value ?? 'all'}
            type="button"
            aria-pressed={active}
            onClick={() => onStatus(option.value)}
            className={cn(CHIP, active ? 'bg-brown text-cream hover:bg-brown-800' : 'bg-transparent text-brown hover:bg-hover')}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
