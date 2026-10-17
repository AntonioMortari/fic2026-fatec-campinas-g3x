import { createEvent, fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { prefersReducedMotion } from '../lib/motion'
import { BOTTOM_BAR, MENU_GROUPS } from '../lib/navigation'
import { renderRoute } from './render'

describe('bottom bar', () => {
  it('has the bar destinations, then Apoiar and Menu', () => {
    renderRoute('/')
    const bar = screen.getByRole('navigation', { name: 'Atalhos' })
    const labels = within(bar)
      .getAllByRole('listitem')
      .map((item) => item.textContent)

    expect(labels).toEqual([...BOTTOM_BAR.map((destination) => destination.label), 'Apoiar', 'Menu'])
  })

  it('marks only the current route with aria-current', () => {
    renderRoute('/')
    const bar = screen.getByRole('navigation', { name: 'Atalhos' })

    expect(within(bar).getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page')
    expect(within(bar).getByRole('link', { name: 'Agenda' })).not.toHaveAttribute('aria-current')
  })

  it('draws one ochre marker that slides to the current column, and hides it where no item is current', () => {
    renderRoute('/agenda')
    const bar = screen.getByRole('navigation', { name: 'Atalhos' })
    const marker = bar.querySelector<HTMLElement>('[data-marker-index]')!

    expect(bar.querySelectorAll('[data-marker-index]')).toHaveLength(1)
    expect(marker).toHaveAttribute('data-marker-index', '1')
    expect(marker.style.transform).toBe('translateX(100%)')
    expect(marker.style.width).toBe('20%')
    expect(marker.className).toContain('transition-[transform,opacity]')
  })

  it('hides the marker on a page that is in no section of the bar', () => {
    renderRoute('/uma-pagina-que-nao-existe')
    const marker = screen.getByRole('navigation', { name: 'Atalhos' }).querySelector<HTMLElement>('[data-marker-index]')!

    expect(marker.style.opacity).toBe('0')
  })

  it('shrinks the word a little while it is pressed', () => {
    renderRoute('/')
    const bar = screen.getByRole('navigation', { name: 'Atalhos' })

    const link = within(bar).getByRole('link', { name: 'Agenda' })
    expect(link.className).toContain('active:scale-[.94]')
    expect(link.className).toContain('transition-[color,transform,scale]')
  })
})

function pointer(type: 'pointerDown' | 'pointerMove' | 'pointerUp', target: Element, clientY: number, timeStamp: number) {
  const event = createEvent[type](target, { clientY, button: 0, pointerId: 1 })
  Object.defineProperty(event, 'timeStamp', { value: timeStamp })
  fireEvent(target, event)
}

describe('bottom sheet follows the finger (round 22h)', () => {
  async function openMenu() {
    const user = userEvent.setup()
    Element.prototype.setPointerCapture = () => undefined
    renderRoute('/')
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    const menu = screen.getByRole('dialog', { name: 'Menu' })
    return { menu, zone: menu.querySelector('[data-sheet-handle]')! }
  }

  it('moves with the finger, with no transition while it is held, and never above its resting place', async () => {
    const { menu, zone } = await openMenu()

    pointer('pointerDown', zone, 100, 1000)
    expect(menu.style.transition).toBe('none')
    pointer('pointerMove', zone, 140, 1400)
    expect(menu.style.transform).toBe('translateY(40px)')
    pointer('pointerMove', zone, 60, 1800)
    expect(menu.style.transform).toBe('translateY(0px)')
  })

  it('closes when it passed 80px', async () => {
    const { menu, zone } = await openMenu()

    pointer('pointerDown', zone, 100, 1000)
    pointer('pointerMove', zone, 200, 2000)
    pointer('pointerUp', zone, 200, 2000)

    expect(menu).not.toHaveAttribute('open')
    expect(menu.style.transform).toBe('')
    expect(menu.style.transition).toBe('')
  })

  it('closes when it was let go fast, even before 80px', async () => {
    const { menu, zone } = await openMenu()

    pointer('pointerDown', zone, 100, 1000)
    pointer('pointerMove', zone, 140, 1040)
    pointer('pointerUp', zone, 140, 1040)

    expect(menu).not.toHaveAttribute('open')
  })

  it('goes back up when it was slow and short, and stays open', async () => {
    const { menu, zone } = await openMenu()

    pointer('pointerDown', zone, 100, 1000)
    pointer('pointerMove', zone, 150, 2000)
    pointer('pointerUp', zone, 150, 2000)

    expect(menu).toHaveAttribute('open')
    expect(menu.style.transform).toBe('')
    expect(menu.style.transition).toBe('')
  })

  it('does not start a drag from the close button', async () => {
    const { menu } = await openMenu()
    const close = within(menu).getByRole('button', { name: 'Fechar o menu' })

    pointer('pointerDown', close, 100, 1000)

    expect(menu.style.transition).toBe('')
  })
})

describe('bottom sheet menu', () => {
  it('opens from the Menu button with the three groups and WhatsApp', async () => {
    const user = userEvent.setup()
    renderRoute('/')
    const button = screen.getByRole('button', { name: 'Menu' })
    expect(button).toHaveAttribute('aria-expanded', 'false')

    await user.click(button)

    const menu = screen.getByRole('dialog', { name: 'Menu' })
    expect(menu).toHaveAttribute('open')
    for (const group of MENU_GROUPS) {
      expect(within(menu).getByRole('heading', { name: group.title })).toBeInTheDocument()
    }
    expect(within(menu).getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', 'https://wa.me/5511953968344')
  })

  it('keeps the bottom bar visible on top of the sheet, with Menu marked and closing it', async () => {
    const user = userEvent.setup()
    renderRoute('/')
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    const menu = screen.getByRole('dialog', { name: 'Menu' })
    const barInMenu = within(menu).getByRole('navigation', { name: 'Atalhos' })
    const menuButton = within(barInMenu).getByRole('button', { name: 'Menu' })

    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    expect(within(barInMenu).getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current')

    await user.click(menuButton)
    expect(menu).not.toHaveAttribute('open')
  })

  it('closes with the × button', async () => {
    const user = userEvent.setup()
    renderRoute('/')
    await user.click(screen.getByRole('button', { name: 'Menu' }))

    await user.click(screen.getByRole('button', { name: 'Fechar o menu' }))

    expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute('open')
  })

  it('"Aa" opens the menu at the reading controls', async () => {
    const user = userEvent.setup()
    renderRoute('/')

    await user.click(screen.getByRole('button', { name: /^Aa, acessibilidade/ }))

    expect(screen.getByRole('heading', { name: 'Leitura' })).toHaveFocus()
  })
})

describe('reading preferences', () => {
  it('A+ enlarges the root text and the choice is saved on the device', async () => {
    const user = userEvent.setup()
    renderRoute('/')
    await user.click(screen.getByRole('button', { name: 'Menu' }))

    await user.click(screen.getByRole('button', { name: /^A\+/ }))
    await user.click(screen.getByRole('button', { name: /^A\+/ }))

    expect(document.documentElement).toHaveAttribute('data-font-scale', '2')
    expect(localStorage.getItem('af-font')).toBe('2')
  })

  it('A+ stops at the limit, and "A" resets by removing the attribute', async () => {
    const user = userEvent.setup()
    renderRoute('/')
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    const increase = screen.getByRole('button', { name: /^A\+/ })

    for (let i = 0; i < 5; i++) if (!(increase as HTMLButtonElement).disabled) await user.click(increase)
    expect(document.documentElement).toHaveAttribute('data-font-scale', '3')
    expect(increase).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /^A, texto no tamanho normal/ }))
    expect(document.documentElement).not.toHaveAttribute('data-font-scale')
    expect(localStorage.getItem('af-font')).toBeNull()
  })

  it('high contrast swaps the tokens and exposes its state with aria-pressed', async () => {
    const user = userEvent.setup()
    renderRoute('/')
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    const contrast = screen.getByRole('button', { name: /Alto contraste/ })

    await user.click(contrast)

    expect(document.documentElement).toHaveAttribute('data-contrast', 'high')
    expect(contrast).toHaveAttribute('aria-pressed', 'true')
    expect(localStorage.getItem('af-contrast')).toBe('high')
  })

  it('"Reduzir movimento" is the same choice as the device setting: it marks the page, is saved and says its state', async () => {
    const user = userEvent.setup()
    renderRoute('/')
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    const motion = screen.getByRole('button', { name: /Reduzir movimento/ })
    expect(motion).toHaveAttribute('aria-pressed', 'false')

    await user.click(motion)

    expect(document.documentElement).toHaveAttribute('data-motion', 'reduced')
    expect(motion).toHaveAttribute('aria-pressed', 'true')
    expect(localStorage.getItem('af-motion')).toBe('reduced')
    expect(prefersReducedMotion()).toBe(true)

    await user.click(motion)

    expect(document.documentElement).not.toHaveAttribute('data-motion')
    expect(localStorage.getItem('af-motion')).toBeNull()
  })

  it('reapplies what was saved', () => {
    localStorage.setItem('af-font', '1')
    localStorage.setItem('af-contrast', 'high')
    localStorage.setItem('af-motion', 'reduced')

    renderRoute('/')

    expect(document.documentElement).toHaveAttribute('data-font-scale', '1')
    expect(document.documentElement).toHaveAttribute('data-contrast', 'high')
    expect(document.documentElement).toHaveAttribute('data-motion', 'reduced')
  })

  it('ignores a saved value out of range', () => {
    localStorage.setItem('af-font', '9')

    renderRoute('/')

    expect(document.documentElement).not.toHaveAttribute('data-font-scale')
  })
})
