import { CONTACT_STATUS_LABELS } from '../../lib/contacts-admin'
import { cn } from '../../lib/cn'
import type { ContactStatus } from '../../types/contacts'

const TONES: Record<ContactStatus, string> = {
  new: 'border-ochre bg-ochre text-brown',
  in_contact: 'border-blue-deep bg-transparent text-blue-deep',
  done: 'border-line-strong bg-transparent text-brown-400',
}

export function ContactStatusBadge({ status, className }: { status: ContactStatus; className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[0.71875rem] leading-[1.2] font-bold', TONES[status], className)}>
      {CONTACT_STATUS_LABELS[status]}
    </span>
  )
}
