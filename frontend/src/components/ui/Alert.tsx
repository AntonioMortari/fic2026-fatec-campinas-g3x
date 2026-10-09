import { forwardRef, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

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
        'border-[1.5px] border-brown px-4 py-3 text-[0.9375rem] outline-none focus-visible:shadow-focus',
        tone === 'error' ? 'bg-card font-bold' : 'bg-cream-dark',
        className,
      )}
    >
      {children}
    </div>
  )
})
