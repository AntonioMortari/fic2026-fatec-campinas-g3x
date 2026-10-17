import { act, render, screen } from '@testing-library/react'
import { Reveal } from '../components/ui'
import { renderRoute } from './render'

type Callback = IntersectionObserverCallback
let notify: Callback = () => undefined
const observed = new Set<Element>()

function stubObserver() {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: Callback) {
        notify = callback
      }
      observe(element: Element) {
        observed.add(element)
      }
      unobserve(element: Element) {
        observed.delete(element)
      }
      disconnect() {}
    },
  )
}


const entry = (target: Element, isIntersecting: boolean) => ({ isIntersecting, target }) as unknown as IntersectionObserverEntry

afterEach(() => {
  observed.clear()
  vi.unstubAllGlobals()
})

describe('reveal on scroll (round 22k)', () => {
  it('hides nothing on its own: a block starts waiting only when the browser can tell it when to show', () => {
    stubObserver()
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 5000 } as DOMRect)
    render(<Reveal>conteúdo</Reveal>)

    const block = screen.getByText('conteúdo')
    expect(block).toHaveAttribute('data-reveal')
    expect(block).not.toHaveAttribute('data-revealed')
    expect(observed.has(block)).toBe(true)
  })

  it('shows a block once, when it enters the screen, and stops watching it, so scrolling back hides nothing', () => {
    stubObserver()
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 5000 } as DOMRect)
    render(<Reveal>conteúdo</Reveal>)
    const block = screen.getByText('conteúdo')

    act(() => notify([entry(block, false)], {} as IntersectionObserver))
    expect(block).not.toHaveAttribute('data-revealed')

    act(() => notify([entry(block, true)], {} as IntersectionObserver))
    expect(block).toHaveAttribute('data-revealed')
    expect(observed.has(block)).toBe(false)

    act(() => notify([entry(block, false)], {} as IntersectionObserver))
    expect(block).toHaveAttribute('data-revealed')
  })

  it('shows at once, without animating, what is already on screen when the page opens', () => {
    stubObserver()
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 100 } as DOMRect)
    render(<Reveal>conteúdo</Reveal>)

    const block = screen.getByText('conteúdo')
    expect(block).toHaveAttribute('data-revealed')
    expect(block).toHaveAttribute('data-reveal-instant')
    expect(observed.size).toBe(0)
  })

  it('shows everything when the browser has no IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    render(<Reveal>conteúdo</Reveal>)

    expect(screen.getByText('conteúdo')).toHaveAttribute('data-revealed')
  })

  it('stops watching a block that leaves the page', () => {
    stubObserver()
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 5000 } as DOMRect)
    const { unmount } = render(<Reveal>conteúdo</Reveal>)
    expect(observed.size).toBe(1)

    unmount()

    expect(observed.size).toBe(0)
  })

  it('is on the story pages only: Início and Quem somos reveal their blocks, the agenda does not', () => {
    stubObserver()
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 5000 } as DOMRect)

    renderRoute('/quem-somos')
    const about = document.querySelectorAll('[data-reveal]').length
    expect(about).toBeGreaterThanOrEqual(6)
    expect(document.querySelector('h1')?.closest('[data-reveal]')).toBeNull()
  })

  it('does not reveal anything on the agenda', () => {
    stubObserver()
    renderRoute('/agenda')

    expect(document.querySelectorAll('[data-reveal]')).toHaveLength(0)
  })
})
