import { cn } from '../../lib/cn'
import { STAFF_STATUS_LABELS } from '../../lib/volunteering'
import type { VolunteerStatus } from '../../types/volunteering'

const TONES: Record<VolunteerStatus, string> = {
  new: 'border-ochre bg-ochre text-brown',
  in_contact: 'border-blue-deep bg-transparent text-blue-deep',
  volunteering: 'border-brown bg-brown text-cream',
  ended: 'border-line-strong bg-transparent text-brown-400',
}

export function VolunteerStatusBadge({ status }: { status: VolunteerStatus }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[0.71875rem] leading-[1.2] font-bold', TONES[status])}>
      {STAFF_STATUS_LABELS[status]}
    </span>
  )
}
