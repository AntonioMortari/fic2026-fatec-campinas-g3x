import type { ReactNode } from 'react'

interface AdminTitleProps {
  title: ReactNode
  lead?: ReactNode
  action?: ReactNode
}

// The heading of a panel screen (designs 9b and 9c): title on the left, the one secondary action on the right, lead below.
export function AdminTitle({ title, lead, action }: AdminTitleProps) {
  return (
    <header className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h1 className="m-0 text-[1.75rem] leading-[1.2] font-bold text-pretty desktop:text-[2.125rem]">{title}</h1>
        {action && <div className="pt-0.5">{action}</div>}
      </div>
      {lead && <p className="m-0 max-w-[40rem] text-small text-brown-400 desktop:text-body">{lead}</p>}
    </header>
  )
}
