import { useRef, type PointerEvent } from 'react'

// Passed 80px, or let go while still moving fast, the sheet closes; otherwise it goes back up (round 22h).
export const SHEET_CLOSE_DISTANCE = 80
export const SHEET_CLOSE_VELOCITY = 0.6

interface Drag {
  startY: number
  lastY: number
  lastTime: number
  velocity: number
}

export function useSheetDrag() {
  const dialog = useRef<HTMLDialogElement>(null)
  const drag = useRef<Drag | null>(null)

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button, a')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { startY: event.clientY, lastY: event.clientY, lastTime: event.timeStamp, velocity: 0 }
    if (dialog.current) dialog.current.style.transition = 'none'
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const current = drag.current
    const element = dialog.current
    if (!current || !element) return
    const elapsed = event.timeStamp - current.lastTime
    if (elapsed > 0) current.velocity = (event.clientY - current.lastY) / elapsed
    current.lastY = event.clientY
    current.lastTime = event.timeStamp
    element.style.transform = `translateY(${Math.max(0, event.clientY - current.startY)}px)`
  }

  function finish(event: PointerEvent<HTMLElement>) {
    const current = drag.current
    const element = dialog.current
    drag.current = null
    if (!current || !element) return
    const distance = Math.max(0, event.clientY - current.startY)
    const closing = distance > SHEET_CLOSE_DISTANCE || (distance > 0 && current.velocity > SHEET_CLOSE_VELOCITY)
    element.style.transition = ''
    element.style.transform = ''
    if (closing) element.close()
  }

  return { dialog, handle: { onPointerDown, onPointerMove, onPointerUp: finish, onPointerCancel: finish } }
}
