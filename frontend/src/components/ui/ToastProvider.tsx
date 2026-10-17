import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { prefersReducedMotion } from '../../lib/motion'
import { TOAST_DURATION_MS, TOAST_EXIT_MS, TOAST_UNDO_DURATION_MS, ToastContext, type ToastOptions } from './toast-context'

interface Toast extends ToastOptions {
  id: number
  message: string
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const [leaving, setLeaving] = useState(false)
  const nextId = useRef(0)

  const show = useCallback((message: string, options: ToastOptions = {}) => {
    nextId.current += 1
    setLeaving(false)
    setToast({ id: nextId.current, message, ...options })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => {
      if (prefersReducedMotion()) return setToast(null)
      setLeaving(true)
    }, toast.action ? TOAST_UNDO_DURATION_MS : TOAST_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!leaving) return
    const timer = window.setTimeout(() => setToast(null), TOAST_EXIT_MS)
    return () => window.clearTimeout(timer)
  }, [leaving])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-24 z-40 flex justify-center desktop:bottom-6">
        {toast && (
          <div
            key={toast.id}
            className={cn(
              leaving ? 'pointer-events-none animate-sink' : 'pointer-events-auto animate-toast-in',
              'flex w-full max-w-xl items-center justify-between gap-3 px-3.5 py-3 text-[0.90625rem] text-cream shadow-[4px_4px_0_var(--color-ochre)]',
              toast.tone === 'error' ? 'bg-error' : 'bg-brown',
            )}
          >
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick()
                  setToast(null)
                }}
                className="min-h-11 cursor-pointer bg-transparent px-1 text-small font-bold text-ochre hover:text-cream"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}
