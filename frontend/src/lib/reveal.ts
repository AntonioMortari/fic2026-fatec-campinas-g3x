// One observer for the whole page (round 22k). A block is revealed once, the first time 15% of it is on screen.
let observer: IntersectionObserver | null = null

function shared(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.setAttribute('data-revealed', '')
        observer?.unobserve(entry.target)
      }
    },
    { threshold: 0.15 },
  )
  return observer
}

export function revealOnScroll(element: HTMLElement): () => void {
  if (typeof IntersectionObserver === 'undefined' || element.hasAttribute('data-revealed')) {
    element.setAttribute('data-revealed', '')
    return () => undefined
  }
  if (element.getBoundingClientRect().top < window.innerHeight) {
    element.setAttribute('data-reveal-instant', '')
    element.setAttribute('data-revealed', '')
    return () => undefined
  }
  const watcher = shared()
  watcher.observe(element)
  return () => watcher.unobserve(element)
}
