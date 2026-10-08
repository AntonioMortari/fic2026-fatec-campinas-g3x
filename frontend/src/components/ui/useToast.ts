import { useContext } from 'react'
import { ToastContext, type ShowToast } from './toast-context'

export function useToast(): ShowToast {
  const show = useContext(ToastContext)
  if (!show) throw new Error('useToast must be used inside <ToastProvider>')
  return show
}
