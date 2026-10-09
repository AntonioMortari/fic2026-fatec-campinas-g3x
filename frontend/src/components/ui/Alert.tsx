import { forwardRef, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { ErrorIcon } from './ErrorIcon'

interface AlertProps {
  tone: 'error' | 'info'
  children: ReactNode
  className?: string
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert({ tone, children, className }, ref) {
  return (
    <div
      ref={ref}
      role={tone === 'error' ? 'alert' : 'status'}
      tabIndex={-1}
      className={cn(
        'border-[1.5px] px-4 py-3 text-[0.9375rem] outline-none focus-visible:shadow-focus',
        tone === 'error' ? 'flex items-start gap-2.5 border-error bg-error-tint font-bold text-brown' : 'border-brown bg-cream-dark',
        className,
      )}
    >
      {tone === 'error' && <ErrorIcon className="mt-[0.2em] shrink-0 text-error" />}
      {tone === 'error' ? <span>{children}</span> : children}
    </div>
  )
})
