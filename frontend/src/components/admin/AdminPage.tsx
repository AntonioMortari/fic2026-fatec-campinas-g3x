import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

// The content area of every panel screen (designs 9a-9c, 10a-10e): 16px on the phone, 48px from the side menu on the desktop.
export function AdminPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-4 pt-5 pb-8 desktop:px-12 desktop:pt-9 desktop:pb-12', className)}>{children}</div>
}
