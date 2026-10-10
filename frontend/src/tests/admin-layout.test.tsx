import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { fakeUser, mockApi } from './auth-support'
import { renderRoute } from './render'

let mock: ReturnType<typeof mockApi>
afterEach(() => mock?.restore())

const STAFF = { ...fakeUser, isStaff: true }
const GREETING = /^(Bom dia|Boa tarde|Boa noite), Maria da Silva$/

function openAs(account: typeof fakeUser | null, events: unknown[] = []) {
  if (account) localStorage.setItem('af-session', '1')
  mock = mockApi({
    'POST /auth/refresh': () => ({ status: 200, data: { token: 'a.b.c', user: account } }),
    'GET /admin/events': () => ({ status: 200, data: { data: events } }),
    'GET /admin/events/11111111-1111-4111-8111-111111111111/attendance': () => ({ status: 200, data: { event: { title: 'Roda', startsAt: '2030-11-20T18:00:00.000Z' }, data: [] } }),
  })
}

describe("the panel's own frame (screen 2c)", () => {
  it('has the panel header with the way back to the public site, and not the public header', async () => {
    openAs(STAFF)
    renderRoute('/admin')
    await screen.findByRole('heading', { name: GREETING })

    const header = screen.getAllByRole('banner')[0]!
    expect(within(header).getByText('Painel')).toBeInTheDocument()
    expect(within(header).getByRole('link', { name: 'Ver o site' })).toHaveAttribute('href', '/')
    expect(within(header).queryByRole('link', { name: 'Apoiar' })).not.toBeInTheDocument()
    expect(within(header).queryByRole('button', { name: /Aa, acessibilidade/ })).not.toBeInTheDocument()
  })

  it("has the panel's own bottom bar, not the public one, and no public footer", async () => {
    openAs(STAFF)
    renderRoute('/admin')
    await screen.findByRole('heading', { name: GREETING })

    const bar = screen.getByRole('navigation', { name: 'Atalhos do painel' })
    expect(within(bar).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Início', 'Agenda', 'Mais'])
    expect(screen.queryByRole('navigation', { name: 'Atalhos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
  })

  it('marks only the current destination, and "Início" does not light up on the events pages', async () => {
    openAs(STAFF)
    renderRoute('/admin/eventos')
    await screen.findByRole('heading', { name: 'Eventos e presença', level: 1 })
    const bar = screen.getByRole('navigation', { name: 'Atalhos do painel' })

    expect(within(bar).getByRole('link', { name: 'Agenda' })).toHaveAttribute('aria-current', 'page')
    expect(within(bar).getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current')
  })

  it('marks "Início" on the home of the panel', async () => {
    openAs(STAFF)
    renderRoute('/admin')
    await screen.findByRole('heading', { name: GREETING })

    expect(within(screen.getByRole('navigation', { name: 'Atalhos do painel' })).getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page')
  })

  it('opens the menu from "Mais" with the panel\'s own screens, the reading controls and the bar still visible', async () => {
    const user = userEvent.setup()
    openAs(STAFF)
    renderRoute('/admin')
    await screen.findByRole('heading', { name: GREETING })
    await user.click(within(screen.getByRole('navigation', { name: 'Atalhos do painel' })).getByRole('button', { name: 'Mais' }))

    const menu = screen.getByRole('dialog', { name: 'Painel' })
    expect(within(menu).getByRole('link', { name: 'Relatório', hidden: true })).toHaveAttribute('href', '/admin/relatorio')
    expect(within(menu).getByRole('link', { name: 'Minha conta', hidden: true })).toBeInTheDocument()
    expect(within(menu).getByRole('link', { name: 'Ver o site', hidden: true })).toHaveAttribute('href', '/')
    expect(within(menu).getByRole('button', { name: 'Sair', hidden: true })).toBeInTheDocument()
    expect(within(menu).getByRole('button', { name: /A\+, aumentar o texto/, hidden: true })).toBeInTheDocument()
    const barInMenu = within(menu).getByRole('navigation', { name: 'Atalhos do painel', hidden: true })
    expect(within(barInMenu).getByRole('button', { name: 'Mais', hidden: true })).toHaveAttribute('aria-expanded', 'true')
  })

  it('lists no public page in the panel menu, and no screen that does not exist', async () => {
    const user = userEvent.setup()
    openAs(STAFF)
    renderRoute('/admin')
    await screen.findByRole('heading', { name: GREETING })
    await user.click(within(screen.getByRole('navigation', { name: 'Atalhos do painel' })).getByRole('button', { name: 'Mais' }))
    const menu = screen.getByRole('dialog', { name: 'Painel' })

    expect(within(menu).getAllByRole('heading', { level: 3, hidden: true }).map((heading) => heading.textContent)).toEqual(['Gestão', 'Conta', 'Leitura'])
    for (const missing of ['Atividades', 'Publicações', 'Galeria', 'Biblioteca', 'Configurações', 'Notícias']) {
      expect(within(menu).queryByRole('link', { name: missing, hidden: true })).not.toBeInTheDocument()
    }
  })

  it('swaps the bottom bar for the action bar on the form screens', async () => {
    openAs(STAFF)
    renderRoute('/admin/eventos/novo')
    await screen.findByRole('heading', { name: 'Novo evento' })

    expect(screen.queryByRole('navigation', { name: 'Atalhos do painel' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument()
  })
})

describe("the desktop frame of the panel (screen 7j)", () => {
  it('has the side menu with only the screens that exist, and marks the current one', async () => {
    openAs(STAFF)
    renderRoute('/admin/eventos')
    await screen.findByRole('heading', { name: 'Eventos e presença', level: 1 })
    const side = screen.getByRole('navigation', { name: 'Seções do painel' })

    expect(within(side).getAllByRole('link').map((link) => link.textContent)).toEqual(['Início', 'Eventos e presença', 'Relatório'])
    expect(within(side).getAllByRole('region').map((group) => group.getAttribute('aria-label'))).toEqual(['Agenda', 'Gestão'])
    expect(within(side).getByRole('link', { name: 'Eventos e presença' })).toHaveAttribute('aria-current', 'page')
    expect(within(side).getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current')
    for (const missing of ['Atividades', 'Pessoas', 'Conteúdo', 'Biblioteca', 'Configurações']) {
      expect(within(side).queryByRole('link', { name: missing })).not.toBeInTheDocument()
    }
  })

  it('has the header with the badge, the name of who is signed in and the way back to the site', async () => {
    openAs(STAFF)
    renderRoute('/admin')
    await screen.findByRole('heading', { name: GREETING })
    const header = screen.getAllByRole('banner')[0]!

    expect(within(header).getByRole('link', { name: 'Minha conta, Maria da Silva' })).toHaveAttribute('href', '/minha-conta')
    expect(within(header).getByText('Maria da Silva')).toBeInTheDocument()
    expect(within(header).getByRole('link', { name: 'Ver o site' })).toHaveAttribute('href', '/')
  })

  it('hides the panel header on small screens only on the attendance list, which brings its own', async () => {
    openAs(STAFF)
    renderRoute('/admin/eventos/11111111-1111-4111-8111-111111111111/presenca')
    await screen.findByRole('heading', { name: 'Lista de presença' })
    expect(screen.getAllByRole('banner')[0]!.className).toContain('max-desktop:hidden')
  })

  it('keeps the panel header on every other screen', async () => {
    openAs(STAFF)
    renderRoute('/admin')
    await screen.findByRole('heading', { name: GREETING })
    expect(screen.getAllByRole('banner')[0]!.className).not.toContain('max-desktop:hidden')
  })
})

describe('the public menu', () => {
  it('keeps the account block after the site groups', async () => {
    const user = userEvent.setup()
    openAs(STAFF)
    renderRoute('/')
    await screen.findByRole('link', { name: /^Minha conta/ })
    await user.click(screen.getByRole('button', { name: 'Menu' }))

    const headings = within(screen.getByRole('dialog', { name: 'Menu' })).getAllByRole('heading', { level: 3, hidden: true }).map((heading) => heading.textContent)
    expect(headings.indexOf('Sua conta')).toBeGreaterThan(headings.indexOf('Ler'))
  })
})

const publishedLater = {
  id: '22222222-2222-4222-8222-222222222222',
  title: 'Cafú e o Café',
  description: null,
  category: 'Contação',
  startsAt: '2030-11-20T18:00:00.000Z',
  endsAt: null,
  location: 'Sede',
  ageRange: null,
  capacity: 20,
  spotsLeft: 18,
  requiresCpf: false,
  published: true,
  registrationCount: 2,
  updatedAt: '2030-11-01T00:00:00.000Z',
}

describe('the home of the panel (designs 9a and 10a)', () => {
  it('greets by name, shows the next event with the way to the attendance list, and has the new-event action', async () => {
    openAs(STAFF, [publishedLater])
    renderRoute('/admin')

    expect(await screen.findByRole('heading', { name: GREETING })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Próximo evento' })).toBeInTheDocument()
    expect(screen.getByText('Cafú e o Café')).toBeInTheDocument()
    expect(screen.getByText(/18 de 20 vagas/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Abrir lista de presença' })).toHaveAttribute('href', `/admin/eventos/${publishedLater.id}/presenca`)
    expect(screen.getAllByRole('link', { name: '+ Novo evento' })[0]).toHaveAttribute('href', '/admin/eventos/novo')
    expect(screen.queryByRole('heading', { name: 'Todas as telas' })).not.toBeInTheDocument()
  })

  it('counts only what exists as "Precisa de você": drafts, with a verb, and says so when there is nothing', async () => {
    openAs(STAFF, [{ ...publishedLater, id: '33333333-3333-4333-8333-333333333333', published: false }])
    renderRoute('/admin')

    expect(await screen.findByRole('heading', { name: 'Precisa de você · 1' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Rascunho para publicar/ })).toHaveAttribute('href', '/admin/eventos')
  })

  it('says so when there is nothing to do and nothing coming', async () => {
    openAs(STAFF, [])
    renderRoute('/admin')

    expect(await screen.findByText('Nada esperando você. Tudo em dia.')).toBeInTheDocument()
    expect(screen.getByText('Nenhum evento publicado vem por aí.')).toBeInTheDocument()
  })

  it('invents no pending count for screens that do not exist', async () => {
    openAs(STAFF, [])
    renderRoute('/admin')
    await screen.findByRole('heading', { name: GREETING })

    expect(screen.queryByText(/contatos novos|depoimentos|candidaturas|doação/i)).not.toBeInTheDocument()
  })
})

describe('who gets the frame', () => {
  it('shows the 404 inside the public site, with its header and footer, to someone who is not staff', async () => {
    openAs(fakeUser)
    renderRoute('/admin')

    expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Atalhos' })).toBeInTheDocument()
    expect(screen.queryByText('Ver o site')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Atalhos do painel' })).not.toBeInTheDocument()
  })

  it('does not draw the panel frame for a visitor either', async () => {
    mock = mockApi({})
    renderRoute('/admin/eventos')

    expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
    expect(screen.queryByText('Ver o site')).not.toBeInTheDocument()
  })

  it('does not put the panel frame on the public pages, for staff either', async () => {
    openAs(STAFF)
    renderRoute('/agenda')
    await screen.findByRole('link', { name: /^Minha conta/ })

    expect(screen.queryByText('Ver o site')).not.toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Atalhos' })).toBeInTheDocument()
  })
})
