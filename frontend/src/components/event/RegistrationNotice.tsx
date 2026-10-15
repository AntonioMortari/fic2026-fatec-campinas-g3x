import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import type { RegistrationView } from '../../lib/event-detail'
import { ErrorIcon } from '../ui'

export function RegistrationNotice({ notice, className }: { notice: NonNullable<RegistrationView['notice']>; className?: string }) {
  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-2.5 border-[1.5px] p-3.5 text-[0.96875rem] leading-[1.55] desktop:text-[0.9375rem]',
        notice.tone === 'alert' ? 'border-error' : 'border-brown',
        className,
      )}
    >
      {notice.icon && <ErrorIcon className="mt-[0.25em] shrink-0 text-error" />}
      <p className="m-0">
        {notice.text}
        {notice.linkText && notice.linkTo && (
          <>
            {' '}
            <Link to={notice.linkTo}>{notice.linkText}</Link>
          </>
        )}
      </p>
    </div>
  )
}
