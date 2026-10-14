import { useEffect, useRef, type ReactNode } from 'react'
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
export function ConfirmDialog({ open, title, children, confirmLabel, busy = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) element.showModal()
    else if (!open && element.open) element.close()
  }, [open])

  return (
    <dialog
      ref={dialog}
      aria-labelledby="confirm-title"
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      className="m-auto w-[min(30rem,calc(100%-2rem))] max-w-none border-[1.5px] border-brown bg-cream p-5 text-brown shadow-[8px_8px_0_var(--color-ochre)] backdrop:bg-scrim desktop:p-7"
    >
      {open && (
        <div className="flex flex-col gap-3.5">
          <h2 id="confirm-title" className="m-0 text-[1.5rem] leading-[1.2] font-bold">
            {title}
          </h2>
          <p className="m-0 text-[0.96875rem] leading-[1.55]">{children}</p>
          <div className="flex flex-wrap justify-end gap-2.5 pt-1.5">
            <Button variant="secondary" size="compact" className="min-h-12 px-4.5 text-[0.9375rem]" onClick={onCancel}>
              Cancelar
            </Button>
            <Button variant="applique" size="compact" className="min-h-12 px-5 text-[0.9375rem]" disabled={busy} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      )}
    </dialog>
  )
}
