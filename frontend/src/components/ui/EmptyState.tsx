import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { ErrorIcon } from './ErrorIcon'

interface EmptyStateProps {
  title: string
  text?: ReactNode
  actions?: ReactNode
  tone?: 'neutral' | 'error'
}

export function EmptyState({ title, text, actions, tone = 'neutral' }: EmptyStateProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex flex-col items-start gap-2.5 border-[1.5px] border-dashed px-4.5 py-5.5',
        tone === 'error' ? 'border-error bg-error-tint' : 'border-brown-300',
      )}
    >
      <p className={cn('m-0 flex items-start gap-2 text-item font-bold', tone === 'error' && 'text-error')}>
        {tone === 'error' && <ErrorIcon className="mt-[0.2em] shrink-0" />}
        <span>{title}</span>
      </p>
      {text && <p className="m-0 text-[0.9375rem] text-brown-600">{text}</p>}
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
