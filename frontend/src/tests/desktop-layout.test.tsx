import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DESKTOP_MENU_GROUPS, DESKTOP_NAV, MENU_GROUPS } from '../lib/navigation'
import { renderRoute } from './render'

function desktop() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('64rem'),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }))
}

afterEach(() => vi.unstubAllGlobals())

describe('desktop menu panel (design 8a)', () => {
  it('lists only what the header does not repeat, with the one-line explanations', async () => {
    desktop()
    const user = userEvent.setup()
    renderRoute('/')
    await user.click(screen.getByRole('button', { name: /^Mais/ }))

    const menu = screen.getByRole('dialog', { name: 'Menu' })
    const inHeader = new Set(DESKTOP_NAV.map((destination) => destination.to))
    const links = within(menu)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))
    for (const href of links) expect(inHeader.has(href as string)).toBe(false)
    expect(within(menu).getByRole('link', { name: /Galeria\s*Fotos das oficinas e saraus/ })).toHaveAttribute('href', '/galeria')
    expect(within(menu).getByRole('link', { name: /WhatsApp/ })).toHaveAttribute('href', 'https://wa.me/5511953968344')
    expect(within(menu).getByRole('button', { name: /Alto contraste/ })).toBeInTheDocument()
  })

  it('marks "Mais" as expanded while open and closes with a click outside the panel', async () => {
    desktop()
    const user = userEvent.setup()
    renderRoute('/')
    const more = screen.getByRole('button', { name: /^Mais/ })
    expect(more).toHaveAttribute('aria-expanded', 'false')

    await user.click(more)
    expect(more).toHaveAttribute('aria-expanded', 'true')
    const menu = screen.getByRole('dialog', { name: 'Menu' })
    expect(menu).toHaveAttribute('open')

    await user.click(menu)
    expect(menu).not.toHaveAttribute('open')
    expect(more).toHaveAttribute('aria-expanded', 'false')
  })

  it('keeps every destination reachable on desktop: no repeated and no unknown route', () => {
    const everyMobileTarget = MENU_GROUPS.flatMap((group) => group.items.map((item) => item.to))
    const panelTargets = DESKTOP_MENU_GROUPS.flatMap((group) => group.items.map((item) => item.to))
    const header = DESKTOP_NAV.map((destination) => destination.to)
    for (const target of everyMobileTarget) expect([...header, ...panelTargets]).toContain(target)
    expect(new Set(panelTargets).size).toBe(panelTargets.length)
  })

  it('shows the staff panel link for staff, since the header only has the name and "Sair"', async () => {
    desktop()
    localStorage.setItem('af-session', '1')
    const { mockApi } = await import('./auth-support')
    const staff = { id: 1, name: 'Equipe Ateliê', email: 'e@x.com', phone: null, personType: 'individual', isStaff: true }
    const mock = mockApi({ 'POST /auth/refresh': () => ({ status: 200, data: { token: 'a.b.c', user: staff } }) })
    const user = userEvent.setup()
    renderRoute('/')
    await user.click(await screen.findByRole('button', { name: /^Mais/ }))

    expect(within(screen.getByRole('dialog', { name: 'Menu' })).getByRole('link', { name: 'Painel da equipe' })).toHaveAttribute('href', '/admin')
    mock.restore()
  })
})

describe('focused layout and sign-in screen (designs 3f and 8b)', () => {
  it('names the destination in the back link; plain "Voltar" on sign-in is completed by the desktop text', () => {
    renderRoute('/entrar?voltar=%2Fvoluntariado')

    expect(screen.getByRole('link', { name: 'Voltar para Voluntariado' })).toHaveAttribute('href', '/voluntariado')
  })

  it('puts the "where you go after" note after the form, not before the tabs', () => {
    renderRoute('/entrar?voltar=%2Fvoluntariado')
    const note = screen.getByText(/Depois de entrar, você volta para/)
    const tabs = screen.getByRole('tablist')

    expect(tabs.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('does not mark required fields with an asterisk (the design only marks the optional ones)', () => {
    renderRoute('/entrar')

    expect(screen.getByLabelText(/^E-mail/)).toBeRequired()
    expect(screen.getByText('E-mail', { selector: 'label' }).textContent).toBe('E-mail')
  })

  it('tells the visitor that signing up for an event needs no account', () => {
    renderRoute('/entrar')

    expect(screen.getAllByText(/Inscrição (em evento )?não precisa de conta/).length).toBeGreaterThan(0)
  })
})
