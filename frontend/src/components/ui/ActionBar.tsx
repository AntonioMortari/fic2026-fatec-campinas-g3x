import type { ReactNode } from 'react'

interface ActionBarProps {
  primary: ReactNode
  secondary?: ReactNode
  // Design 7b: the quiet "Cancelar" comes first and the big button fills the rest of the row.
  secondaryFirst?: boolean
  // Lets the buttons drop to a second row when the text is large and the screen is narrow, instead of squeezing them.
  wrap?: boolean
}

export function ActionBar({ primary, secondary, secondaryFirst = false, wrap = false }: ActionBarProps) {
  return (
    <div
      className={`safe-area-bottom fixed inset-x-0 bottom-0 z-30 gap-2 print:hidden border-t border-line bg-cream px-4 pt-3 desktop:static desktop:mt-8 desktop:flex desktop:border-0 desktop:bg-transparent desktop:p-0 ${
        wrap ? 'flex flex-wrap' : secondaryFirst ? 'grid grid-cols-[auto_1fr] items-center' : 'grid grid-cols-[1fr_auto]'
      }`}
    >
      {secondaryFirst ? secondary : primary}
      {secondaryFirst ? primary : secondary}
    </div>
  )
}
