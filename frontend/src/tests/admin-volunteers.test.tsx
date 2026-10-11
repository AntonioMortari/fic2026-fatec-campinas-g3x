import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AdminVolunteerApplication } from '../types/volunteering'
import { apiError, fakeUser, mockApi } from './auth-support'
import { renderRoute } from './render'
import { AREAS, COUNTS, queueEntry } from './volunteering-support'

type Handlers = Parameters<typeof mockApi>[0]

let mock: ReturnType<typeof mockApi>
afterEach(() => {
  mock?.restore()
  vi.unstubAllGlobals()
})

const STAFF = { ...fakeUser, isStaff: true }
const HOUR = 60 * 60 * 1000
const ago = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString()

const THIAGO = queueEntry({ id: 't1', name: 'Thiago Ramos', email: 'thiago@exemplo.com', phone: '11977776666', message: null, createdAt: ago(1), areas: [{ id: 'producao-eventos', name: 'Produção de eventos' }] })
const LARISSA = queueEntry({ id: 'l1', createdAt: ago(50) })
const FERNANDA = queueEntry({ id: 'f1', name: 'Fernanda Oliveira', email: 'fernanda@exemplo.com', status: 'in_contact', createdAt: '2026-01-12T12:00:00.000Z', message: null, areas: [{ id: 'acervo', name: 'Organização de acervo' }] })
const RAFAEL = queueEntry({ id: 'r1', name: 'Rafael Santos', email: 'rafael@exemplo.com', status: 'volunteering', createdAt: '2026-01-03T12:00:00.000Z', message: null })
const DENISE = queueEntry({ id: 'd1', name: 'Denise Costa', email: 'denise@exemplo.com', status: 'ended', phone: null, createdAt: '2025-03-10T12:00:00.000Z', message: null })
const QUEUE = [THIAGO, LARISSA, FERNANDA, RAFAEL, DENISE]

function listing(rows: AdminVolunteerApplication[] = QUEUE): Handlers {
  return {
    'GET /admin/volunteer-applications': (request) => {
      const { status, area } = (request.params ?? {}) as { status?: string; area?: string }
      const data = rows.filter((row) => (!status || row.status === status) && (!area || row.areas.some((entry) => entry.id === area)))
      return { status: 200, data: { data, counts: COUNTS } }
    },
    'GET /admin/volunteer-applications/counts': () => ({ status: 200, data: { counts: COUNTS } }),
    'GET /volunteer-areas': () => ({ status: 200, data: { data: AREAS } }),
    ...Object.fromEntries(rows.map((row) => [`GET /admin/volunteer-applications/${row.id}`, () => ({ status: 200, data: { application: row } })])),
  }
}

function open(handlers: Handlers = listing(), { desktop = false, account = STAFF }: { desktop?: boolean; account?: typeof fakeUser } = {}) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: desktop && query.includes('64rem'),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }))
  localStorage.setItem('af-session', '1')
  mock = mockApi({
    'POST /auth/refresh': () => ({ status: 200, data: { token: 'a.b.c', user: account } }),
    ...handlers,
  })
}

const calls = (key: string) => mock.requests.filter((request) => `${request.method} ${request.url}` === key)

describe('the volunteer queue is for staff only', () => {
  it('answers the 404 of the public site to someone who is not staff, and asks the API for nothing', async () => {
    open(listing(), { account: fakeUser })
    renderRoute('/admin/voluntarios')

    expect(await screen.findByText(/Página não encontrada|não encontrad/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Voluntários' })).not.toBeInTheDocument()
    expect(calls('GET /admin/volunteer-applications')).toHaveLength(0)
  })

  it('does the same for the screen of one application', async () => {
    open(listing(), { account: fakeUser })
    renderRoute('/admin/voluntarios/l1')

    await screen.findByText(/Página não encontrada|não encontrad/i)
    expect(calls('GET /admin/volunteer-applications/l1')).toHaveLength(0)
  })
})

describe('the queue on the phone (list)', () => {
  it('opens with the title, the lead and the export, and lists the people with situation, date and areas', async () => {
    open()
    renderRoute('/admin/voluntarios')

    expect(await screen.findByRole('heading', { level: 1, name: 'Voluntários' })).toBeInTheDocument()
    expect(screen.getByText('Quem se candidata pela página de voluntariado do site aparece aqui.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exportar CSV' })).toBeInTheDocument()
    const rows = within(await screen.findByRole('list', { name: 'Candidaturas' })).getAllByRole('listitem')
    expect(rows).toHaveLength(5)
    expect(rows[0]).toHaveTextContent('Thiago Ramos')
    expect(rows[0]).toHaveTextContent('Nova')
    expect(rows[0]).toHaveTextContent('hoje')
    expect(rows[0]).toHaveTextContent('Produção de eventos')
    expect(rows[1]).toHaveTextContent('há 2 dias')
    expect(rows[1]).toHaveTextContent('Apoio pedagógico e oficinas · Comunicação e mídias')
    expect(rows[2]).toHaveTextContent('Em contato')
    expect(rows[3]).toHaveTextContent('Voluntariando')
    expect(rows[4]).toHaveTextContent('Encerrada')
    expect(rows[4]).toHaveTextContent('mar 2025')
  })

  it('uses the words of the staff and greys out the ended ones without hiding them', async () => {
    open()
    renderRoute('/admin/voluntarios')

    const rows = within(await screen.findByRole('list', { name: 'Candidaturas' })).getAllByRole('listitem')
    expect(within(rows[4]!).getByText('Denise Costa')).toHaveClass('text-brown-400')
    expect(within(rows[0]!).getByText('Thiago Ramos')).not.toHaveClass('text-brown-400')
    expect(screen.queryByText('Recebida, ainda sem resposta')).not.toBeInTheDocument()
  })

  it('draws the chips with the count of each situation, and the area filter with the five areas', async () => {
    open()
    renderRoute('/admin/voluntarios')

    const group = within(await screen.findByRole('group', { name: 'Situação' }))
    await waitFor(() =>
      expect(group.getAllByRole('button').map((button) => button.textContent)).toEqual(['Todas', 'Novas · 2', 'Em contato · 1', 'Voluntariando · 1', 'Encerradas · 1']),
    )
    expect(group.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true')
    const area = await screen.findByRole('combobox', { name: 'Filtrar por área' })
    await waitFor(() => expect(within(area).getAllByRole('option')).toHaveLength(6))
    expect(within(area).getByRole('option', { name: 'Área: todas' })).toBeInTheDocument()
    expect(within(area).getByRole('option', { name: 'Área: Organização de acervo' })).toBeInTheDocument()
  })

  it('asks the API for the chosen situation and keeps it in the address', async () => {
    const user = userEvent.setup()
    open()
    const router = renderRoute('/admin/voluntarios')
    await screen.findByRole('list', { name: 'Candidaturas' })

    await user.click(screen.getByRole('button', { name: 'Em contato · 1' }))

    await waitFor(() => expect(calls('GET /admin/volunteer-applications').at(-1)?.params).toEqual({ status: 'in_contact' }))
    expect(router.state.location.search).toBe('?status=in_contact')
    expect(screen.getByRole('button', { name: 'Em contato · 1' })).toHaveAttribute('aria-pressed', 'true')
    const rows = within(await screen.findByRole('list', { name: 'Candidaturas' })).getAllByRole('listitem')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveTextContent('Fernanda Oliveira')
  })

  it('combines situation and area, and goes back to everything with "Todas"', async () => {
    const user = userEvent.setup()
    open()
    const router = renderRoute('/admin/voluntarios')
    await screen.findByRole('list', { name: 'Candidaturas' })
    await waitFor(() => expect(within(screen.getByRole('combobox', { name: 'Filtrar por área' })).getAllByRole('option')).toHaveLength(6))

    await user.selectOptions(screen.getByRole('combobox', { name: 'Filtrar por área' }), 'producao-eventos')
    await user.click(screen.getByRole('button', { name: 'Novas · 2' }))

    await waitFor(() => expect(calls('GET /admin/volunteer-applications').at(-1)?.params).toEqual({ area: 'producao-eventos', status: 'new' }))
    expect(router.state.location.search).toContain('area=producao-eventos')
    expect(router.state.location.search).toContain('status=new')

    await user.click(screen.getByRole('button', { name: 'Todas' }))
    await waitFor(() => expect(calls('GET /admin/volunteer-applications').at(-1)?.params).toEqual({ area: 'producao-eventos' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filtrar por área' }), '')
    await waitFor(() => expect(calls('GET /admin/volunteer-applications').at(-1)?.params).toEqual({}))
    expect(router.state.location.search).toBe('')
  })

  it.each(['status=zzz', 'area=Acervo!', 'area=../x'])('ignores a garbage address (%s) and asks for everything', async (query) => {
    open()
    renderRoute(`/admin/voluntarios?${query}`)

    await screen.findByRole('list', { name: 'Candidaturas' })
    expect(calls('GET /admin/volunteer-applications').every((request) => Object.keys(request.params ?? {}).length === 0)).toBe(true)
  })

  it('says nobody applied yet, when there is nobody', async () => {
    open(listing([]))
    renderRoute('/admin/voluntarios')

    expect(await screen.findByText('Ninguém se candidatou ainda')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Candidaturas' })).not.toBeInTheDocument()
  })

  it('says nothing matches the filters, which is not the same as nobody applying', async () => {
    const user = userEvent.setup()
    open()
    renderRoute('/admin/voluntarios')
    await screen.findByRole('list', { name: 'Candidaturas' })
    await waitFor(() => expect(within(screen.getByRole('combobox', { name: 'Filtrar por área' })).getAllByRole('option')).toHaveLength(6))

    await user.selectOptions(screen.getByRole('combobox', { name: 'Filtrar por área' }), 'administrativo')

    expect(await screen.findByText('Nenhuma candidatura com esses filtros')).toBeInTheDocument()
    expect(screen.queryByText('Ninguém se candidatou ainda')).not.toBeInTheDocument()
  })

  it('says it is loading, and says when it could not load, and tries again', async () => {
    const user = userEvent.setup()
    let attempts = 0
    open({
      ...listing(),
      'GET /admin/volunteer-applications': () => (++attempts === 1 ? 'network-error' : { status: 200, data: { data: QUEUE, counts: COUNTS } }),
    })
    renderRoute('/admin/voluntarios')

    expect(await screen.findByText('Não conseguimos carregar as candidaturas')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByRole('list', { name: 'Candidaturas' })).toBeInTheDocument()
  })

  it('opens an application on its own screen, keeping the filter in the address', async () => {
    const user = userEvent.setup()
    open()
    const router = renderRoute('/admin/voluntarios?status=new')
    await screen.findByRole('list', { name: 'Candidaturas' })

    await user.click(screen.getByRole('link', { name: /Thiago Ramos/ }))

    expect(router.state.location.pathname).toBe('/admin/voluntarios/t1')
    expect(router.state.location.search).toBe('?status=new')
  })
})

describe('the screen of one application (design 10k)', () => {
  it('shows who, when, the contact as links, the areas and what the person wrote', async () => {
    open()
    renderRoute('/admin/voluntarios/l1')

    expect(await screen.findByRole('heading', { name: 'Larissa Mendes' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'larissa@exemplo.com' })).toHaveAttribute('href', 'mailto:larissa@exemplo.com')
    expect(screen.getByRole('link', { name: '(11) 98123-4567' })).toHaveAttribute('href', 'tel:11981234567')
    const areas = within(screen.getByRole('list', { name: 'Áreas' }))
    expect(areas.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Apoio pedagógico e oficinas', 'Comunicação e mídias'])
    expect(screen.getByText('Sou pedagoga e tenho as manhãs de sábado livres.')).toBeInTheDocument()
  })

  it('has the back link to the queue with the filter, and the staff badge, and no public bottom bar', async () => {
    open()
    renderRoute('/admin/voluntarios/l1?status=new')

    await screen.findByRole('heading', { name: 'Larissa Mendes' })
    const back = screen.getAllByRole('link', { name: /Voluntários/ }).find((link) => link.getAttribute('href')?.startsWith('/admin/voluntarios?'))
    expect(back).toHaveAttribute('href', '/admin/voluntarios?status=new')
    expect(screen.getByText('Equipe')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Atalhos do painel' })).not.toBeInTheDocument()
  })

  it('offers the WhatsApp of the person in a new tab, and none when there is no phone', async () => {
    open()
    renderRoute('/admin/voluntarios/l1')

    const link = await screen.findByRole('link', { name: /WhatsApp/ })
    expect(link).toHaveAttribute('href', 'https://wa.me/5511981234567')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('has no WhatsApp and says so when the person gave no phone', async () => {
    open()
    renderRoute('/admin/voluntarios/d1')

    expect(await screen.findByRole('heading', { name: 'Denise Costa' })).toBeInTheDocument()
    expect(screen.getByText('Não informado')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /WhatsApp/ })).not.toBeInTheDocument()
  })

  it('shows the situation as one of four, with the right one chosen, and says what ending does', async () => {
    open()
    renderRoute('/admin/voluntarios/f1')

    const group = within(await screen.findByRole('group', { name: 'Em que pé está' }))
    expect(group.getAllByRole('radio').map((radio) => radio.closest('label')?.textContent)).toEqual(['Nova', 'Em contato', 'Voluntariando', 'Encerrada'])
    expect(group.getByRole('radio', { name: 'Em contato' })).toBeChecked()
    expect(screen.getByText(/Encerrar devolve à pessoa o direito de se candidatar de novo\./)).toBeInTheDocument()
  })

  it.each([
    ['l1', 'Marcar "em contato"', 'in_contact'],
    ['f1', 'Marcar como voluntariando', 'volunteering'],
    ['r1', 'Encerrar', 'ended'],
    ['d1', 'Marcar como nova', 'new'],
  ])('has as the main action for %s the natural next step: %s', async (id, label, next) => {
    const user = userEvent.setup()
    open({
      ...listing(),
      [`PATCH /admin/volunteer-applications/${id}/status`]: () => ({ status: 200, data: { application: { ...QUEUE.find((row) => row.id === id)!, status: next } } }),
    })
    renderRoute(`/admin/voluntarios/${id}`)

    await user.click(await screen.findByRole('button', { name: label }))

    await waitFor(() => expect(calls(`PATCH /admin/volunteer-applications/${id}/status`)).toHaveLength(1))
    expect(calls(`PATCH /admin/volunteer-applications/${id}/status`)[0]!.body).toEqual({ status: next })
  })

  it('moves to any of the four situations from the chooser, sending only the status', async () => {
    const user = userEvent.setup()
    open({
      ...listing(),
      'PATCH /admin/volunteer-applications/l1/status': () => ({ status: 200, data: { application: { ...LARISSA, status: 'ended' } } }),
    })
    renderRoute('/admin/voluntarios/l1')

    await user.click(await screen.findByRole('radio', { name: 'Encerrada' }))

    await waitFor(() => expect(calls('PATCH /admin/volunteer-applications/l1/status')).toHaveLength(1))
    expect(calls('PATCH /admin/volunteer-applications/l1/status')[0]!.body).toEqual({ status: 'ended' })
  })

  it('does not ask the API when the situation chosen is the one it already has', async () => {
    const user = userEvent.setup()
    open()
    renderRoute('/admin/voluntarios/l1')

    await user.click(await screen.findByRole('radio', { name: 'Nova' }))

    expect(calls('PATCH /admin/volunteer-applications/l1/status')).toHaveLength(0)
  })

  it('confirms the change with an undo that puts the previous situation back', async () => {
    const user = userEvent.setup()
    open({
      ...listing(),
      'PATCH /admin/volunteer-applications/l1/status': (request) => ({ status: 200, data: { application: { ...LARISSA, status: (request.body as { status: string }).status } } }),
    })
    renderRoute('/admin/voluntarios/l1')

    await user.click(await screen.findByRole('radio', { name: 'Encerrada' }))
    expect(await screen.findByText('Larissa Mendes: encerrada.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Desfazer' }))

    await waitFor(() => expect(calls('PATCH /admin/volunteer-applications/l1/status')).toHaveLength(2))
    expect(calls('PATCH /admin/volunteer-applications/l1/status').map((request) => request.body)).toEqual([{ status: 'ended' }, { status: 'new' }])
    expect(await screen.findByRole('radio', { name: 'Nova' })).toBeChecked()
  })

  it('says why, and keeps the old situation, when the server refuses to reopen one', async () => {
    const user = userEvent.setup()
    open({
      ...listing(),
      'PATCH /admin/volunteer-applications/d1/status': () =>
        apiError(409, 'live_application_exists', 'Esta pessoa já tem outra candidatura em andamento. Encerre uma das duas antes.'),
    })
    renderRoute('/admin/voluntarios/d1')

    await user.click(await screen.findByRole('radio', { name: 'Em contato' }))

    expect(await screen.findByText('Esta pessoa já tem outra candidatura em andamento. Encerre uma das duas antes.')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Encerrada' })).toBeChecked()
  })

  it('says the application was not found, with the way back', async () => {
    open({ ...listing(), 'GET /admin/volunteer-applications/zz': () => apiError(404, 'application_not_found', 'Não encontramos essa candidatura.') })
    renderRoute('/admin/voluntarios/zz')

    expect(await screen.findByText('Não encontramos essa candidatura')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para a fila' })).toHaveAttribute('href', '/admin/voluntarios')
  })
})

describe('the queue on the desktop (design 10j)', () => {
  it('shows the list and the first application side by side, with the first one chosen', async () => {
    open(listing(), { desktop: true })
    renderRoute('/admin/voluntarios')

    const rows = within(await screen.findByRole('list', { name: 'Candidaturas' })).getAllByRole('listitem')
    expect(within(rows[0]!).getByRole('link')).toHaveAttribute('aria-current', 'true')
    expect(await screen.findByRole('heading', { name: 'Thiago Ramos', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'thiago@exemplo.com' })).toBeInTheDocument()
  })

  it('shows the application of the address, marking its row', async () => {
    open(listing(), { desktop: true })
    renderRoute('/admin/voluntarios/l1')

    expect(await screen.findByRole('heading', { name: 'Larissa Mendes', level: 2 })).toBeInTheDocument()
    const rows = within(await screen.findByRole('list', { name: 'Candidaturas' })).getAllByRole('listitem')
    expect(within(rows[1]!).getByRole('link')).toHaveAttribute('aria-current', 'true')
    expect(within(rows[0]!).getByRole('link')).not.toHaveAttribute('aria-current')
  })

  it('says "Candidatou-se em" with the date and time of the application in the zone of São Paulo', async () => {
    open(listing(), { desktop: true })
    renderRoute('/admin/voluntarios/f1')

    expect(await screen.findByText(/Candidatou-se em/)).toBeInTheDocument()
    expect(screen.getByText('12 jan, 09:00')).toBeInTheDocument()
  })

  it('offers "Chamar no WhatsApp" and the main action in the panel', async () => {
    open(listing(), { desktop: true })
    renderRoute('/admin/voluntarios/l1')

    expect(await screen.findByRole('link', { name: /Chamar no WhatsApp/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Marcar "em contato"' })).toBeInTheDocument()
  })
})

describe('the export', () => {
  it('downloads the spreadsheet of what is on screen, with the same filters', async () => {
    const user = userEvent.setup()
    open({ ...listing(), 'GET /admin/volunteer-applications/export.csv': () => ({ status: 200, data: new Blob(['x']) }) })
    const created = vi.fn(() => 'blob:x')
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: created, revokeObjectURL: vi.fn() }))
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    renderRoute('/admin/voluntarios?status=new&area=acervo')

    await user.click(await screen.findByRole('button', { name: 'Exportar CSV' }))

    await waitFor(() => expect(click).toHaveBeenCalledOnce())
    expect(calls('GET /admin/volunteer-applications/export.csv')[0]!.params).toEqual({ status: 'new', area: 'acervo' })
    click.mockRestore()
  })

  it('says it could not download', async () => {
    const user = userEvent.setup()
    open({ ...listing(), 'GET /admin/volunteer-applications/export.csv': () => 'network-error' })
    renderRoute('/admin/voluntarios')

    await user.click(await screen.findByRole('button', { name: 'Exportar CSV' }))

    expect(await screen.findByText('Não foi possível baixar a planilha agora. Tente de novo.')).toBeInTheDocument()
  })
})

describe('the menu of the panel', () => {
  it('has "Voluntários" under "Pessoas" with the number of new ones, and marks it when it is the current screen', async () => {
    open(listing(), { desktop: true })
    renderRoute('/admin/voluntarios/l1')

    const side = within(await screen.findByRole('navigation', { name: 'Seções do painel' }))
    const link = side.getByRole('link', { name: /Voluntários/ })
    expect(link).toHaveAttribute('href', '/admin/voluntarios')
    expect(link).toHaveAttribute('aria-current', 'page')
    expect(await within(link).findByText('novas', { exact: false })).toBeInTheDocument()
    expect(link).toHaveTextContent('2')
    expect(side.getByRole('region', { name: 'Pessoas' })).toBeInTheDocument()
  })

  it('shows no badge when nothing is new, and not a zero', async () => {
    open({ ...listing(), 'GET /admin/volunteer-applications/counts': () => ({ status: 200, data: { counts: { ...COUNTS, new: 0 } } }) })
    renderRoute('/admin/voluntarios')

    const side = within(await screen.findByRole('navigation', { name: 'Seções do painel' }))
    await waitFor(() => expect(calls('GET /admin/volunteer-applications/counts').length).toBeGreaterThan(0))
    expect(side.getByRole('link', { name: 'Voluntários' })).toHaveTextContent(/^Voluntários$/)
  })

  it('has the entry in the "Mais" sheet of the phone too', async () => {
    const user = userEvent.setup()
    open()
    renderRoute('/admin')
    await user.click(within(await screen.findByRole('navigation', { name: 'Atalhos do painel' })).getByRole('button', { name: 'Mais' }))

    const menu = within(screen.getByRole('dialog', { name: 'Painel' }))
    expect(menu.getByRole('link', { name: /Voluntários/, hidden: true })).toHaveAttribute('href', '/admin/voluntarios')
  })
})
