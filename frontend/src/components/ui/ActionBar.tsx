import type { ReactNode } from 'react'

interface ActionBarProps {
  primary: ReactNode
  secondary?: ReactNode
  // Design 7b: the quiet "Cancelar" comes first and the big button fills the rest of the row.
  secondaryFirst?: boolean
}

export function ActionBar({ primary, secondary, secondaryFirst = false }: ActionBarProps) {
  return (
    <div
      className={`safe-area-bottom fixed inset-x-0 bottom-0 z-30 grid gap-2 border-t-[1.5px] border-brown bg-card px-4 pt-3 desktop:static desktop:mt-8 desktop:flex desktop:border-0 desktop:bg-transparent desktop:p-0 ${
        secondaryFirst ? 'grid-cols-[auto_1fr] items-center' : 'grid-cols-[1fr_auto]'
      }`}
    >
      {secondaryFirst ? secondary : primary}
      {secondaryFirst ? primary : secondary}
    </div>
  )
}
