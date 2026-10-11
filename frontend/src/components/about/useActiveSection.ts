import { useEffect, useState } from 'react'

export function useActiveSection(ids: readonly string[]): string {
  const [active, setActive] = useState(ids[0] ?? '')

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      // A section counts as current while it crosses the middle band of the screen, below the sticky header and chips.
      { rootMargin: '-40% 0px -55% 0px' },
    )
    for (const id of ids) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [ids])

  return active
}
