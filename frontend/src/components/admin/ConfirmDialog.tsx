import { useEffect, useRef, useId, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { DESKTOP_QUERY, useMediaQuery } from '../../lib/use-media-query'
import { Button } from '../ui'

interface ConfirmDialogProps {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// A native <dialog>: the browser traps the focus, closes on Esc and gives the focus back to whoever opened it.
// On the phone it is the sheet that rises from the bottom (design 11k); on the desktop it is a card in the middle (11j).
export function ConfirmDialog({ open, title, children, confirmLabel, busy = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const desktop = useMediaQuery(DESKTOP_QUERY)

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) element.showModal()
    else if (!open && element.open) element.close()
  }, [open])

  return (
    <dialog
      ref={dialog}
      data-sheet={desktop ? undefined : ''}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
      className={cn(
        'max-h-none border-brown bg-cream p-0 text-brown backdrop:bg-scrim',
        desktop ? 'm-auto w-[min(30rem,calc(100%-2rem))] border-[1.5px] shadow-[8px_8px_0_var(--color-ochre)]' : 'm-0 mt-auto w-full max-w-none border-0 border-t-[1.5px]',
      )}
    >
      {open && (
        <div className="flex flex-col gap-3 px-4 pt-6 pb-8 desktop:gap-3.5 desktop:p-7">
          <h2 id={titleId} className="m-0 text-[1.375rem] leading-[1.2] font-bold desktop:text-[1.5rem]">
            {title}
          </h2>
          <p className="m-0 text-[0.9375rem] leading-[1.55] desktop:text-[0.96875rem]">{children}</p>
          <div className="flex flex-col-reverse gap-3 desktop:flex-row desktop:flex-wrap desktop:justify-end desktop:gap-2.5 desktop:pt-1.5">
            <Button variant="secondary" className="min-h-13 text-[1rem] desktop:min-h-12 desktop:px-4.5 desktop:text-[0.9375rem]" onClick={onCancel}>
              Cancelar
            </Button>
            <Button variant="applique" className="min-h-13 text-[1rem] desktop:min-h-12 desktop:px-5 desktop:text-[0.9375rem]" disabled={busy} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      )}
    </dialog>
  )
}
