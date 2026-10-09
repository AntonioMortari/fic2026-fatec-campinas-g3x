import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface PageHeaderProps {
  overline?: string
  title: ReactNode
  lead?: ReactNode
  action?: ReactNode
  aside?: ReactNode
  className?: string
}

export function PageHeader({ overline, title, lead, action, aside, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-2.5 pt-6 pb-5 desktop:flex-row desktop:items-end desktop:justify-between desktop:gap-10 desktop:pt-12 desktop:pb-8', className)}>
      <div className="flex max-w-3xl flex-col gap-2.5">
        {overline && <p className="m-0 text-overline font-semibold uppercase tracking-[0.12em] text-ochre-deep">{overline}</p>}
        <h1 className="m-0 text-h1 font-bold text-pretty desktop:text-h1-desktop">{title}</h1>
        {lead && <p className="m-0 text-body text-pretty text-brown-600 desktop:text-lg">{lead}</p>}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {aside && <div className="mt-3 desktop:mt-0">{aside}</div>}
    </header>
  )
}
