import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { isLive, joinAreas, queueDate } from '../../lib/volunteering'
import type { AdminVolunteerApplication } from '../../types/volunteering'
import { VolunteerStatusBadge } from './VolunteerStatusBadge'

interface VolunteerRowProps {
  application: AdminVolunteerApplication
  to: string
  selected: boolean
}

export function VolunteerRow({ application, to, selected }: VolunteerRowProps) {
  const ended = !isLive(application.status)
  const fresh = application.status === 'new'

  return (
    <li className="border-b border-line">
      <Link
        to={to}
        aria-current={selected ? 'true' : undefined}
        className={cn(
          'flex min-h-18 flex-col gap-1 border-y border-transparent px-0 py-[15px] text-brown no-underline hover:bg-hover hover:text-brown desktop:-my-px desktop:border-r desktop:border-l-[3px] desktop:pr-4 desktop:pl-[17px]',
          selected && 'desktop:border-brown desktop:bg-card',
        )}
      >
        <span className="flex items-center gap-2.5">
          <span className={cn('min-w-0 truncate text-[1rem] leading-[1.2] font-bold', ended && 'text-brown-400')}>{application.name}</span>
          <VolunteerStatusBadge status={application.status} />
          <time dateTime={application.createdAt} className={cn('ml-auto shrink-0 text-[0.8125rem] font-semibold', fresh ? 'text-ochre-deep' : 'text-brown-400')}>
            {queueDate(application.createdAt)}
          </time>
        </span>
        <span className={cn('text-small', ended ? 'text-brown-400' : 'text-brown-600')}>{joinAreas(application.areas)}</span>
      </Link>
    </li>
  )
}
