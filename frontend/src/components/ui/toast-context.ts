import { createContext } from 'react'

export interface ToastOptions {
  action?: { label: string; onClick: () => void }
  tone?: 'error'
}

export type ShowToast = (message: string, options?: ToastOptions) => void

export const ToastContext = createContext<ShowToast | null>(null)

export const TOAST_DURATION_MS = 5000
