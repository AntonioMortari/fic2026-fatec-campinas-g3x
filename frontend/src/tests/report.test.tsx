import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Report } from '../types/report'
import { apiError, fakeUser, mockApi } from './auth-support'
import { renderRoute } from './render'

type Handlers = Parameters<typeof mockApi>[0]

let mock: ReturnType<typeof mockApi>
afterEach(() => {
  mock?.restore()
  vi.unstubAllGlobals()
})

const STAFF = { ...fakeUser, isStaff: true }

const row = (id: string, title: string, startsAt: string, counts: [number | null, number | null, number | null, number | null]) => ({
  id,
  title,
  startsAt,
  registered: counts[0],
  attended: counts[1],
  missed: counts[2],
  unchecked: counts[3],
})

const REPORT: Report = {
  period: 'month',
  offset: 0,
  label: 'Setembro de 2026',
  totals: { activities: 5, registered: 112, attended: 87, missed: 9, unchecked: 16, minorsAttended: 41 },
  events: [
    row('e1', 'Oficina de tambores', '2026-09-28T18:00:00.000Z', [17, 12, 3, 2]),
    row('e2', 'Sarau literário', '2026-09-27T18:00:00.000Z', [25, 19, 2, 4]),
  ],
  eventsTotal: 2,
}

function open(handlers: Handlers = {}, desktop = false) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: desktop && query.includes('64rem'),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }))
  localStorage.setItem('af-session', '1')
  mock = mockApi({
    'POST /auth/refresh': () => ({ status: 200, data: { token: 'a.b.c', user: STAFF } }),
    'GET /admin/report': () => ({ status: 200, data: REPORT }),
    ...handlers,
  })
}

const reportCalls = () => mock.requests.filter((request) => request.url === '/admin/report')

describe('the report on the phone (design 7i)', () => {
  it('is only for staff', async () => {
    localStorage.setItem('af-session', '1')
    mock = mockApi({ 'POST /auth/refresh': () => ({ status: 200, data: { token: 'a.b.c', user: fakeUser } }) })
    renderRoute('/admin/relatorio')

    expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
    expect(reportCalls()).toHaveLength(0)
  })

  it('opens on this month with the four numbers and the way back to the panel', async () => {
    open()
    renderRoute('/admin/relatorio')

    expect(await screen.findByRole('heading', { name: 'Relatório' })).toBeInTheDocument()
    expect(screen.getByText('Para anexar a uma prestação de contas.')).toBeInTheDocument()
    expect(await screen.findByText('Setembro de 2026')).toBeInTheDocument()
    const totals = within(screen.getByText('atividades realizadas').closest('dl')!)
    expect(totals.getByText('5')).toBeInTheDocument()
    expect(totals.getByText('112')).toBeInTheDocument()
    expect(totals.getByText('87')).toBeInTheDocument()
    expect(totals.getByText('41')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Voltar para Início/ })).toHaveAttribute('href', '/admin')
    expect(reportCalls()[0]).toBeDefined()
  })

  it('draws no number the data does not have: nothing about volunteers, donors or money', async () => {
    open()
    renderRoute('/admin/relatorio')
    await screen.findByText('Setembro de 2026')

    expect(screen.queryByText(/voluntários|doadores|valor recebido/)).not.toBeInTheDocument()
  })

  it('tells that not checked is not missed, with the number of sign-ups nobody marked', async () => {
    open()
    renderRoute('/admin/relatorio')

    expect(await screen.findByText(/inscrições sem presença conferida\. Não são faltas/)).toBeInTheDocument()
    expect(screen.getByText('16', { selector: 'strong' })).toBeInTheDocument()
  })

  it('lists each activity with its date and the four counts in words', async () => {
    open()
    renderRoute('/admin/relatorio')

    expect(await screen.findByRole('heading', { name: 'Oficina de tambores' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Por atividade · todas as 2/ })).toBeInTheDocument()
    const item = screen.getByRole('heading', { name: 'Oficina de tambores' }).closest('li')!
    expect(item).toHaveTextContent('17 inscritos · 12 vieram · 3 faltaram · 2 sem conferir')
    expect(item).toHaveTextContent('28/09')
  })

  it('says "5 mais recentes de 14" when the table is cut, and never cuts the numbers above it', async () => {
    open({ 'GET /admin/report': () => ({ status: 200, data: { ...REPORT, period: 'quarter', events: REPORT.events, eventsTotal: 14 } }) })
    renderRoute('/admin/relatorio?periodo=trimestre')

    expect(await screen.findByRole('heading', { name: /Por atividade · 2 mais recentes de 14/ })).toBeInTheDocument()
    expect(screen.getByText('112')).toBeInTheDocument()
  })

  it('asks the API for the chosen window, and the arrows walk back and forward without going past today', async () => {
    const user = userEvent.setup()
    open()
    const router = renderRoute('/admin/relatorio')
    await screen.findByText('Setembro de 2026')
    expect(screen.getByRole('button', { name: 'Período seguinte' })).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: 'Trimestre' }))
    await waitFor(() => expect(reportCalls().at(-1)?.url).toBe('/admin/report'))
    expect(router.state.location.search).toBe('?periodo=trimestre')

    await user.click(screen.getByRole('button', { name: 'Período anterior' }))
    expect(router.state.location.search).toBe('?periodo=trimestre&recuar=1')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Período seguinte' })).toBeEnabled())

    await user.click(screen.getByRole('button', { name: 'Período seguinte' }))
    expect(router.state.location.search).toBe('?periodo=trimestre')
  })

  it('shows a dash for a count that failed, never a zero', async () => {
    open({
      'GET /admin/report': () => ({
        status: 200,
        data: { ...REPORT, totals: { ...REPORT.totals, attended: null, minorsAttended: null, unchecked: null }, events: [row('e1', 'Oficina de tambores', '2026-09-28T18:00:00.000Z', [17, null, null, null])] },
      }),
    })
    renderRoute('/admin/relatorio')

    const totals = within((await screen.findByText('presentes conferidos')).closest('dl')!)
    expect(totals.getAllByLabelText('sem contagem')).toHaveLength(2)
    expect(screen.getByRole('heading', { name: 'Oficina de tambores' }).closest('li')).toHaveTextContent('17 inscritos · — vieram · — faltaram · — sem conferir')
    expect(screen.queryByText(/inscrições sem presença conferida/)).not.toBeInTheDocument()
  })

  it('says there was no activity, instead of drawing an empty table', async () => {
    open({ 'GET /admin/report': () => ({ status: 200, data: { ...REPORT, totals: { activities: 0, registered: 0, attended: 0, missed: 0, unchecked: 0, minorsAttended: 0 }, events: [], eventsTotal: 0 } }) })
    renderRoute('/admin/relatorio')

    expect(await screen.findByText('Nenhuma atividade realizada neste período')).toBeInTheDocument()
    expect(screen.queryByText(/inscrições sem presença conferida/)).not.toBeInTheDocument()
  })

  it('says it could not load, and tries again', async () => {
    const user = userEvent.setup()
    let attempts = 0
    open({ 'GET /admin/report': () => (++attempts === 1 ? apiError(500, 'internal_error', 'x') : { status: 200, data: REPORT }) })
    renderRoute('/admin/relatorio')

    await user.click(await screen.findByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByText('Setembro de 2026')).toBeInTheDocument()
  })

  it('offers the spreadsheet and the PDF at the bottom, in the place of the bottom bar', async () => {
    const user = userEvent.setup()
    const print = vi.fn()
    vi.stubGlobal('print', print)
    open()
    renderRoute('/admin/relatorio')
    await screen.findByText('Setembro de 2026')

    expect(screen.queryByRole('navigation', { name: 'Atalhos do painel' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Baixar CSV' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Salvar em PDF' }))
    expect(print).toHaveBeenCalledOnce()
  })

  it('downloads the spreadsheet of the window on screen', async () => {
    const user = userEvent.setup()
    const create = vi.fn(() => 'blob:x')
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: create, revokeObjectURL: vi.fn() }))
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    open({ 'GET /admin/report/csv': () => ({ status: 200, data: new Blob(['x']) }) })
    renderRoute('/admin/relatorio?periodo=semestre&recuar=1')
    await screen.findByText('Setembro de 2026')

    await user.click(screen.getByRole('button', { name: 'Baixar CSV' }))

    await waitFor(() => expect(click).toHaveBeenCalledOnce())
    expect(mock.requests.some((request) => request.url === '/admin/report/csv')).toBe(true)
    click.mockRestore()
  })

  it.each(['periodo=ano&recuar=-3', 'recuar=abc', 'recuar=1.5', 'recuar=99999', 'recuar='])('ignores a garbage address (%s) and asks for this month', async (query) => {
    open()
    renderRoute(`/admin/relatorio?${query}`)

    await screen.findByText('Setembro de 2026')
    expect(screen.getByRole('radio', { name: 'Mês' })).toBeChecked()
    expect(reportCalls().every((request) => request.params?.period === 'month' && request.params?.offset === 0)).toBe(true)
  })

  it('goes back to the current window when the period changes, instead of keeping a distance that means something else', async () => {
    const user = userEvent.setup()
    open()
    const router = renderRoute('/admin/relatorio?recuar=2')
    await screen.findByText('Setembro de 2026')

    await user.click(screen.getByRole('radio', { name: 'Trimestre' }))

    expect(router.state.location.search).toBe('?periodo=trimestre')
    await waitFor(() => expect(reportCalls().at(-1)?.params).toEqual({ period: 'quarter', offset: 0 }))
  })

  it('sends the distance as a negative offset to the API', async () => {
    open()
    renderRoute('/admin/relatorio?periodo=semestre&recuar=2')
    await screen.findByText('Setembro de 2026')

    expect(reportCalls()[0]?.params).toEqual({ period: 'semester', offset: -2 })
  })
})

describe('the report on the desktop (design 7j)', () => {
  it('has the title with the period, the overline, the two buttons at the top and the side menu with "Relatório" lit', async () => {
    open({}, true)
    renderRoute('/admin/relatorio')

    expect(await screen.findByRole('heading', { name: 'Relatório · Setembro de 2026' })).toBeInTheDocument()
    expect(screen.getByText('Prestação de contas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Baixar CSV' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar em PDF' })).toBeInTheDocument()
    expect(within(screen.getByRole('navigation', { name: 'Seções do painel' })).getByRole('link', { name: 'Relatório' })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('link', { name: /Voltar para Início/ })).not.toBeInTheDocument()
  })

  it('draws the table with a column for those who missed apart from the ones nobody checked, and a total', async () => {
    open({}, true)
    renderRoute('/admin/relatorio')

    const table = within(await screen.findByRole('table'))
    expect(table.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Atividade', 'Quando', 'Inscritos', 'Vieram', 'Faltaram', 'Sem conferir', 'Proporção'])
    const first = within(table.getByRole('row', { name: /Oficina de tambores/ }))
    expect(first.getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['seg 28/09', '17', '12', '3', '2', ''])
    const total = within(table.getByRole('row', { name: /Total da lista/ }))
    expect(total.getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['', '42', '31', '5', '6', 'todas as 2'])
  })

  it('has "‹ Anterior" and "Seguinte ›" as text, the second one off at the current window', async () => {
    const user = userEvent.setup()
    open({}, true)
    const router = renderRoute('/admin/relatorio')
    await screen.findByRole('table')

    expect(screen.getByRole('button', { name: 'Seguinte ›' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: '‹ Anterior' }))
    expect(router.state.location.search).toBe('?recuar=1')
  })

  it('puts a dash in the total of the list when a row could not be counted', async () => {
    open({ 'GET /admin/report': () => ({ status: 200, data: { ...REPORT, events: [...REPORT.events, row('e3', 'Sem contagem', '2026-09-20T18:00:00.000Z', [null, null, null, null])] } }) }, true)
    renderRoute('/admin/relatorio')

    const total = within((await screen.findByRole('table')).querySelector('tfoot')!)
    expect(total.getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['', '—', '—', '—', '—', 'todas as 2'])
  })
})
