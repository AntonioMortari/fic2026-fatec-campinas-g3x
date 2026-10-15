import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('reapplies what was saved', () => {
    localStorage.setItem('af-font', '1')
    localStorage.setItem('af-contrast', 'high')

    renderRoute('/')

    expect(document.documentElement).toHaveAttribute('data-font-scale', '1')
    expect(document.documentElement).toHaveAttribute('data-contrast', 'high')
  })

  it('ignores a saved value out of range', () => {
    localStorage.setItem('af-font', '9')

    renderRoute('/')

    expect(document.documentElement).not.toHaveAttribute('data-font-scale')
  })
})
