import { useEffect, useRef, type ReactNode } from 'react'
import { revealOnScroll } from '../../lib/reveal'

// Only for pages that tell a story (Início and Quem somos). What is already on screen when the page opens appears ready.
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const element = useRef<HTMLDivElement>(null)

  useEffect(() => (element.current ? revealOnScroll(element.current) : undefined), [])

  return (
    <div ref={element} data-reveal className={className}>
      {children}
    </div>
  )
}
