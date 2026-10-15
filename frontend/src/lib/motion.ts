const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION).matches
}

export function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'auto' : 'smooth'
}

export function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
}

export function scrollToStart() {
  window.scrollTo({ top: 0, left: 0, behavior: scrollBehavior() })
}

export function revealElement(element: HTMLElement, block: ScrollLogicalPosition = 'nearest') {
  element.scrollIntoView({ block, behavior: scrollBehavior() })
}

export function focusAndReveal(element: HTMLElement, block: ScrollLogicalPosition = 'center') {
  element.focus({ preventScroll: true })
  revealElement(element, block)
}
