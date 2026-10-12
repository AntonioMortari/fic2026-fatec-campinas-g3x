import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { contactTitle, isOpen, previewOf, queueDate } from '../../lib/contacts-admin'
import type { AdminContact } from '../../types/contacts'
import { ContactStatusBadge } from './ContactStatusBadge'

interface ContactRowProps {
  contact: AdminContact
  to: string
  selected: boolean
}

export function ContactRow({ contact, to, selected }: ContactRowProps) {
  const done = !isOpen(contact.status)
  const fresh = contact.status === 'new'

  return (
    <li className="border-b border-line">
      <Link
        to={to}
        aria-current={selected ? 'true' : undefined}
        className={cn(
          'grid min-h-18 grid-cols-[minmax(0,1fr)_auto] content-start gap-x-2.5 gap-y-1 border-y border-transparent px-0 py-[15px] text-brown no-underline hover:bg-hover hover:text-brown',
          'desktop:-my-px desktop:grid-cols-[minmax(0,auto)_auto_minmax(0,1fr)] desktop:border-r desktop:border-l-[3px] desktop:pr-4 desktop:pl-[17px]',
          selected && 'desktop:border-brown desktop:bg-card',
        )}
      >
        <span className={cn('min-w-0 truncate text-[1rem] leading-[1.2] font-bold', done && 'text-brown-400')}>{contactTitle(contact)}</span>
        <time
          dateTime={contact.createdAt}
          className={cn('shrink-0 self-baseline text-right text-[0.8125rem] font-semibold desktop:col-start-3 desktop:row-start-1 desktop:justify-self-end', fresh ? 'text-ochre-deep' : 'text-brown-400')}
        >
          {queueDate(contact.createdAt)}
        </time>
        <span className={cn('col-span-2 truncate text-small desktop:col-span-3', done ? 'text-brown-400' : 'text-brown-600')}>{previewOf(contact.message)}</span>
        <ContactStatusBadge status={contact.status} className="col-span-2 justify-self-start desktop:col-span-1 desktop:col-start-2 desktop:row-start-1" />
      </Link>
    </li>
  )
}
