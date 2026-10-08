import type { ReactNode } from 'react'

export function ActionBar({ primary, secondary }: { primary: ReactNode; secondary?: ReactNode }) {
  return (
    <div className="safe-area-bottom fixed inset-x-0 bottom-0 z-30 grid grid-cols-[1fr_auto] gap-2 border-t-[1.5px] border-brown bg-card px-4 pt-3 desktop:static desktop:mt-8 desktop:flex desktop:border-0 desktop:bg-transparent desktop:p-0">
      {primary}
      {secondary}
    </div>
  )
}
