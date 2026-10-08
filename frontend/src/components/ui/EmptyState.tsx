import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  text?: ReactNode
  actions?: ReactNode
}

export function EmptyState({ title, text, actions }: EmptyStateProps) {
  return (
    <div role="status" className="flex flex-col items-start gap-2.5 border-[1.5px] border-dashed border-brown-300 px-4.5 py-5.5">
      <p className="m-0 text-item font-bold">{title}</p>
      {text && <p className="m-0 text-[0.9375rem] text-brown-600">{text}</p>}
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
