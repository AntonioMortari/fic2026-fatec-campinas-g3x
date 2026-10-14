import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { scrollToTop } from '../../lib/motion'

const RESTORE_WINDOW_MS = 600
const positions = new Map<string, number>()

function restoreScroll(top: number): () => void {
  const deadline = performance.now() + RESTORE_WINDOW_MS
  let frame = 0
  const attempt = () => {
    window.scrollTo({ top, left: 0, behavior: 'instant' })
    const reached = Math.abs(window.scrollY - top) < 2
    if (!reached && performance.now() < deadline) frame = requestAnimationFrame(attempt)
  }
  attempt()
  return () => cancelAnimationFrame(frame)
}

export function useRouteFocus() {
  const { pathname, key } = useLocation()
  const navigationType = useNavigationType()
  const previous = useRef(pathname)
  const currentKey = useRef(key)

  useLayoutEffect(() => {
    currentKey.current = key
  }, [key])

  useEffect(() => {
    const remember = () => positions.set(currentKey.current, window.scrollY)
    window.addEventListener('scroll', remember, { passive: true })
    return () => window.removeEventListener('scroll', remember)
  }, [])

  useEffect(() => {
    // Compares with the previous path instead of a "first render" flag, which StrictMode's double effect run defeats.
    if (previous.current === pathname) return
    previous.current = pathname
    document.getElementById('content')?.focus({ preventScroll: true })
    const saved = navigationType === 'POP' ? positions.get(key) : undefined
    if (saved === undefined) return scrollToTop()
    return restoreScroll(saved)
  }, [pathname, key, navigationType])
}
