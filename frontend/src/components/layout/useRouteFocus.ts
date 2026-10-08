import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export function useRouteFocus() {
  const { pathname } = useLocation()
  const previous = useRef(pathname)

  useEffect(() => {
    // Compares with the previous path instead of a "first render" flag, which StrictMode's double effect run defeats.
    if (previous.current === pathname) return
    previous.current = pathname
    document.getElementById('content')?.focus()
    window.scrollTo(0, 0)
  }, [pathname])
}
