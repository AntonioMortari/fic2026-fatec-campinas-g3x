import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { api } from '../services/api'
import type { EventPeriod, EventSummary } from '../types/event'
import { renderRoute } from './render'

function event(overrides: Partial<EventSummary> = {}): EventSummary {
  return {
    id: '3b3a6c52-6b0e-4d0b-9c58-1d2a5f1c9a10',
    title: 'Cafú e o Café',
    description: 'Uma viagem às fazendas de café.',
    category: 'Contação de história',
    startsAt: '2026-10-17T17:00:00.000Z',
    endsAt: '2026-10-17T18:30:00.000Z',
    location: 'Sede, Vila Romero',
    ageRange: 'Livre',
    capacity: 18,
    ...overrides,
  }
}

const UPCOMING = [
  event(),
  event({ id: 'b', title: 'Brasil Negreiro', category: 'Apresentação', startsAt: '2026-10-31T22:00:00.000Z', endsAt: null, location: null, ageRange: null, capacity: null }),
  event({ id: 'c', title: 'Figurinos com materiais reciclados', category: 'Oficina', startsAt: '2026-11-08T13:00:00.000Z', endsAt: null, ageRange: '6–12 anos', capacity: null }),
  event({ id: 'd', title: 'Banzo', category: 'Contação de história', startsAt: '2026-11-20T18:00:00.000Z', endsAt: null, capacity: null }),
]

function serve(responses: Partial<Record<EventPeriod, EventSummary[]>>) {
  vi.mocked(api.get).mockImplementation(async (_url, config) => {
    const { period } = (config?.params ?? { period: 'upcoming' }) as { period: EventPeriod }
    return { data: { data: responses[period] ?? [] } }
  })
}

async function openAgenda(responses: Partial<Record<EventPeriod, EventSummary[]>>) {
  serve(responses)
  renderRoute('/agenda')
  await waitFor(() => expect(screen.queryByText('Carregando a agenda…')).not.toBeInTheDocument())
}

describe('agenda page (UX/UI analysis 2b and 6b)', () => {
  it('opens on the upcoming events with the section title and the real lead text', async () => {
    await openAgenda({ upcoming: UPCOMING })

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Agenda')
    expect(screen.getByText(/Para se inscrever não é preciso criar conta/)).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Em breve' })).toHaveAttribute('aria-selected', 'true')
  })

  it('groups events by month with heading levels h1 > h2 (month) > h3 (event)', async () => {
    await openAgenda({ upcoming: UPCOMING })

    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Outubro', 'Novembro'])
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Cafú e o Café',
      'Brasil Negreiro',
      'Figurinos com materiais reciclados',
      'Banzo',
    ])
  })

  it('highlights only the next event, with its meta line, registration link and calendar download', async () => {
    await openAgenda({ upcoming: UPCOMING })
    const [featured, ...others] = screen.getAllByRole('article')

    expect(within(featured!).getByText('Próxima · Contação de história')).toBeInTheDocument()
    expect(within(featured!).getByText('14h–15h30 · Sede, Vila Romero · Livre · 18 vagas')).toBeInTheDocument()
    expect(within(featured!).getByRole('link', { name: 'Quero me inscrever em Cafú e o Café' })).toHaveAttribute(
      'href',
      '/agenda/3b3a6c52-6b0e-4d0b-9c58-1d2a5f1c9a10/inscricao',
    )
    expect(within(featured!).getByRole('link', { name: /^\+ Agenda/ })).toHaveAttribute(
      'href',
      '/events/3b3a6c52-6b0e-4d0b-9c58-1d2a5f1c9a10/calendar.ics',
    )
    expect(document.querySelectorAll('[class*="shadow-applique"]')).toHaveLength(1)
    for (const article of others) expect(within(article).queryByText(/^Próxima/)).not.toBeInTheDocument()
  })

  it('offers registration on every upcoming event, naming which one', async () => {
    await openAgenda({ upcoming: UPCOMING })

    expect(screen.getByRole('link', { name: 'Inscrever em Banzo' })).toHaveAttribute('href', '/agenda/d/inscricao')
    expect(screen.getAllByRole('link', { name: /^(Quero me inscrever|Inscrever)/ })).toHaveLength(4)
  })

  it('shows "Local a confirmar" when the place is not set, never an invented one', async () => {
    await openAgenda({ upcoming: UPCOMING })

    expect(screen.getByText('19h · Local a confirmar')).toBeInTheDocument()
  })

  it('filters by type, with counts, and goes back to all', async () => {
    const user = userEvent.setup()
    await openAgenda({ upcoming: UPCOMING })
    const filter = screen.getByRole('group', { name: 'Tipo de atividade' })
    expect(within(filter).getByRole('button', { name: 'Todas 4' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(filter).getByRole('button', { name: 'Contação de história 2' })).toBeInTheDocument()

    await user.click(within(filter).getByRole('button', { name: 'Oficina 1' }))
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Figurinos com materiais reciclados'])

    await user.click(within(filter).getByRole('button', { name: 'Todas 4' }))
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4)
  })

  it('does not label a filtered result as "Próxima" when it is not the next event overall', async () => {
    const user = userEvent.setup()
    await openAgenda({ upcoming: UPCOMING })

    await user.click(within(screen.getByRole('group', { name: 'Tipo de atividade' })).getByRole('button', { name: 'Oficina 1' }))

    expect(screen.queryByText(/^Próxima/)).not.toBeInTheDocument()
  })

  it('hides the filter when it would not change the list', async () => {
    await openAgenda({ upcoming: [event({ category: null }), event({ id: 'b', category: null })] })

    expect(screen.queryByRole('group', { name: 'Tipo de atividade' })).not.toBeInTheDocument()
  })

  it('shows the empty state with ways to follow the news, and nothing else, when no event is published', async () => {
    await openAgenda({ upcoming: [] })

    expect(screen.getByText('Nenhuma atividade marcada por enquanto')).toBeInTheDocument()
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Instagram' })).toHaveAttribute('href', 'https://instagram.com/atelie_afrocultural')
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('does not show the empty state when there are events', async () => {
    await openAgenda({ upcoming: UPCOMING })

    expect(screen.queryByText('Nenhuma atividade marcada por enquanto')).not.toBeInTheDocument()
  })

  it('lists past events apart, with no registration, calendar, highlight or capacity', async () => {
    const user = userEvent.setup()
    await openAgenda({ upcoming: UPCOMING, past: [event({ id: 'p', title: 'Oficina de abril', startsAt: '2026-04-11T13:00:00.000Z', endsAt: null })] })

    await user.click(screen.getByRole('tab', { name: 'Já aconteceu' }))

    const article = await screen.findByRole('article')
    expect(within(article).getByRole('heading', { name: 'Oficina de abril' })).toBeInTheDocument()
    expect(within(article).queryByRole('link')).not.toBeInTheDocument()
    expect(within(article).queryByText(/vagas/)).not.toBeInTheDocument()
    expect(document.querySelectorAll('[class*="shadow-applique"]')).toHaveLength(0)
    expect(screen.queryByText('Brasil Negreiro')).not.toBeInTheDocument()
  })

  it('has its own empty state for the past', async () => {
    const user = userEvent.setup()
    await openAgenda({ upcoming: UPCOMING, past: [] })

    await user.click(screen.getByRole('tab', { name: 'Já aconteceu' }))

    expect(await screen.findByText('Ainda não há registro de atividades passadas por aqui')).toBeInTheDocument()
  })

  it('resets the filter when the period changes', async () => {
    const user = userEvent.setup()
    await openAgenda({ upcoming: UPCOMING, past: [event({ id: 'p', category: 'Oficina' }), event({ id: 'q', category: 'Contação' })] })
    await user.click(within(screen.getByRole('group', { name: 'Tipo de atividade' })).getByRole('button', { name: 'Oficina 1' }))

    await user.click(screen.getByRole('tab', { name: 'Já aconteceu' }))

    const filter = await screen.findByRole('group', { name: 'Tipo de atividade' })
    expect(within(filter).getByRole('button', { name: 'Todas 2' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('says the load failed instead of claiming there is nothing scheduled, and lets the person retry', async () => {
    const user = userEvent.setup()
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Network Error'))
    renderRoute('/agenda')

    expect(await screen.findByText('Não conseguimos carregar a agenda agora')).toBeInTheDocument()
    expect(screen.queryByText('Nenhuma atividade marcada por enquanto')).not.toBeInTheDocument()

    serve({ upcoming: UPCOMING })
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByRole('heading', { name: 'Banzo' })).toBeInTheDocument()
  })

  it('links the tab to its panel for screen readers', async () => {
    await openAgenda({ upcoming: UPCOMING })

    const tab = screen.getByRole('tab', { name: 'Em breve' })
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Em breve')
    expect(tab).toHaveAttribute('aria-controls', screen.getByRole('tabpanel').id)
  })

  it('asks the API for the right period', async () => {
    const user = userEvent.setup()
    await openAgenda({ upcoming: UPCOMING })

    await user.click(screen.getByRole('tab', { name: 'Já aconteceu' }))

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/events', { params: { period: 'past', limit: undefined } }))
  })
})

describe('home, now connected to the events API', () => {
  it('shows the next activity from the API', async () => {
    serve({ upcoming: [event()] })
    renderRoute('/')

    const section = await screen.findByRole('region', { name: 'Próxima atividade' })
    expect(within(section).getByRole('heading', { name: 'Cafú e o Café' })).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/events', { params: { period: 'upcoming', limit: 1 } })
  })

  it('does not invent an activity when none is published, or when the API fails', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Network Error'))
    renderRoute('/')

    await screen.findByRole('region', { name: 'Por onde começar' })
    expect(screen.queryByRole('region', { name: 'Próxima atividade' })).not.toBeInTheDocument()
  })
})
