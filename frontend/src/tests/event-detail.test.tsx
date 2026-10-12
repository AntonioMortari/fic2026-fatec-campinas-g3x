import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import type { EventDetail, RegistrationStatus } from '../types/event'
import { apiError, mockApi } from './auth-support'
import { renderRoute } from './render'

let mock: ReturnType<typeof mockApi>
afterEach(() => mock?.restore())

const ID = '3b3a6c52-6b0e-4d0b-9c58-1d2a5f1c9a10'

function detail(overrides: Partial<EventDetail> = {}): EventDetail {
  return {
    id: ID,
    title: 'Cafú e o Café',
    description: 'Uma viagem às fazendas de café do Vale do Paraíba do século XIX, em linguagem acessível.\n\nContação de história performática com música ao vivo.',
    category: 'Contação de história',
    startsAt: '2030-10-19T17:00:00.000Z',
    endsAt: '2030-10-19T18:30:00.000Z',
    location: 'Sede do Ateliê',
    ageRange: 'Livre, para todas as idades',
    capacity: 18,
    spotsLeft: 12,
    registrationOnSite: true,
    registrationStatus: 'open',
    image: null,
    requiresCpf: false,
    registrationsOpen: true,
    ...overrides,
  }
}

async function open(event: EventDetail) {
  mock = mockApi({ [`GET /events/${ID}`]: () => ({ status: 200, data: { event } }) })
  renderRoute(`/agenda/${ID}`)
  await screen.findByRole('heading', { level: 1 })
}

const notice = () => document.querySelector('aside [role="status"]') as HTMLElement
const inRow = (label: string) => screen.getByText(label, { selector: 'dt' }).parentElement as HTMLElement

describe('event detail page (design 13a and 13b)', () => {
  it('shows title, then the fact sheet in the order of the design, with the date on the São Paulo clock', async () => {
    await open(detail())

    expect(screen.getByRole('heading', { level: 1, name: 'Cafú e o Café' })).toBeInTheDocument()
    expect([...document.querySelectorAll('dt')].map((dt) => dt.textContent)).toEqual(['Quando', 'Onde', 'Para quem', 'Inscrição'])
    expect(within(inRow('Quando')).getByText('Sábado, 19 de outubro, das 14h às 15h30')).toBeInTheDocument()
    expect(within(inRow('Onde')).getByText('Sede do Ateliê')).toBeInTheDocument()
    expect(within(inRow('Para quem')).getByText('Livre, para todas as idades')).toBeInTheDocument()
    expect(within(inRow('Inscrição')).getByText('Restam 12 vagas.')).toBeInTheDocument()
  })

  it('leaves out the rows that have no data, but always writes the Inscrição row', async () => {
    await open(detail({ location: null, ageRange: null, capacity: null, spotsLeft: null }))

    expect([...document.querySelectorAll('dt')].map((dt) => dt.textContent)).toEqual(['Quando', 'Inscrição'])
    expect(within(inRow('Inscrição')).getByText('Inscrições abertas')).toBeInTheDocument()
  })

  it('writes the description in paragraphs and omits the section when there is none', async () => {
    await open(detail())
    expect(screen.getAllByText(/^Uma viagem às fazendas/)).toHaveLength(1)
    expect(screen.getByText('Contação de história performática com música ao vivo.')).toBeInTheDocument()
  })

  it('open: "Quero me inscrever" to the registration page, the calendar and the note, in the bar and in the card', async () => {
    await open(detail())

    for (const link of screen.getAllByRole('link', { name: 'Quero me inscrever' })) expect(link).toHaveAttribute('href', `/agenda/${ID}/inscricao`)
    expect(screen.getAllByRole('link', { name: 'Quero me inscrever' })).toHaveLength(2)
    expect(screen.getByRole('link', { name: '+ Agenda' })).toHaveAttribute('href', `/events/${ID}/calendar.ics`)
    expect(screen.getByRole('link', { name: '+ Adicionar à minha agenda' })).toHaveAttribute('href', `/events/${ID}/calendar.ics`)
    expect(screen.getAllByText('Não precisa criar conta.')).toHaveLength(2)
    expect(screen.queryByText(/^Últimas vagas$/i)).not.toBeInTheDocument()
  })

  it('few left: the badge, "Resta 1 vaga." and the note about the spot', async () => {
    await open(detail({ spotsLeft: 1, registrationStatus: 'few_left' }))

    expect(screen.getByText('Últimas vagas')).toBeInTheDocument()
    expect(within(inRow('Inscrição')).getByText('Resta 1 vaga.')).toBeInTheDocument()
    expect(screen.getAllByText('A vaga só fica sua quando a inscrição for enviada.')).toHaveLength(2)
  })

  it('full: badge, the red line, the waiting list by WhatsApp and the notice with the way to the agenda', async () => {
    await open(detail({ spotsLeft: 0, registrationStatus: 'full', registrationsOpen: false }))

    expect(screen.getAllByText('Vagas esgotadas').length).toBeGreaterThanOrEqual(2)
    expect(notice()).toHaveTextContent(
      'As vagas deste evento acabaram. Dá para entrar na lista de espera falando com a gente pelo WhatsApp (11) 95396-8344 — e a agenda tem as próximas datas.',
    )
    expect(screen.getByRole('link', { name: 'a agenda tem as próximas datas.' })).toHaveAttribute('href', '/agenda')
    for (const link of screen.getAllByRole('link', { name: 'Lista de espera pelo WhatsApp' })) expect(link).toHaveAttribute('href', 'https://wa.me/5511953968344')
    expect(screen.queryByRole('link', { name: 'Quero me inscrever' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '+ Agenda' })).toBeInTheDocument()
  })

  it('without sign-up on the site: says so, and the main action is the calendar', async () => {
    await open(detail({ registrationOnSite: false, registrationStatus: 'not_on_site', capacity: null, spotsLeft: null }))

    expect(within(inRow('Inscrição')).getByText('Não precisa se inscrever')).toBeInTheDocument()
    expect(notice()).toHaveTextContent('Este evento não tem inscrição pelo site. É só chegar no horário.')
    for (const link of screen.getAllByRole('link', { name: '+ Adicionar à minha agenda' })) expect(link).toHaveAttribute('href', `/events/${ID}/calendar.ics`)
    expect(screen.queryByRole('link', { name: '+ Agenda' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /inscrever/i })).not.toBeInTheDocument()
  })

  it('already started: badge, "Inscrições encerradas", the notice, no action bar at all', async () => {
    await open(detail({ registrationStatus: 'started', registrationsOpen: false, startsAt: '2020-09-26T17:00:00.000Z', endsAt: null }))

    expect(screen.getByText('Já aconteceu')).toBeInTheDocument()
    expect(within(inRow('Inscrição')).getByText('Inscrições encerradas')).toBeInTheDocument()
    expect(notice()).toHaveTextContent('Este evento já aconteceu, então as inscrições estão encerradas. Veja o que vem por aí.')
    expect(screen.getByRole('link', { name: 'Veja o que vem por aí.' })).toHaveAttribute('href', '/agenda')
    expect(screen.queryByRole('link', { name: /inscrever|^\+ Agenda|Adicionar/i })).not.toBeInTheDocument()
    expect(document.querySelector('[class*="sticky"][class*="bottom-"]')).toBeNull()
  })

  it('count failed: does not promise a spot, offers the WhatsApp, and keeps the page', async () => {
    await open(detail({ registrationStatus: 'unknown', spotsLeft: null }))

    expect(within(inRow('Inscrição')).getByText('Não deu para conferir agora')).toBeInTheDocument()
    expect(notice()).toHaveTextContent(
      'Não deu para carregar as inscrições agora — o banco de dados não respondeu. Nada foi perdido. Tente de novo em alguns instantes, ou chame no WhatsApp (11) 95396-8344 — a gente inscreve você por lá.',
    )
    expect(screen.getAllByRole('link', { name: 'Inscrever pelo WhatsApp' })).toHaveLength(2)
    expect(screen.queryByText(/Restam|Resta /)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Quero me inscrever' })).not.toBeInTheDocument()
  })

  it.each<[RegistrationStatus, boolean]>([
    ['open', true],
    ['few_left', true],
    ['full', false],
    ['not_on_site', false],
    ['started', false],
    ['unknown', false],
  ])('status %s: the registration link is %s', async (registrationStatus, offered) => {
    await open(detail({ registrationStatus }))

    expect(screen.queryAllByRole('link', { name: 'Quero me inscrever' }).length > 0).toBe(offered)
  })

  it('does not draw a link to the gallery, which does not exist in this project', async () => {
    await open(detail({ registrationStatus: 'started' }))

    const main = document.querySelector('main') as HTMLElement
    expect(within(main).queryByText(/galeria/i)).not.toBeInTheDocument()
    expect(main.querySelector('a[href*="galeria"]')).toBeNull()
  })

  it('without a photo, nothing takes its place', async () => {
    await open(detail())

    expect(document.querySelector('main img')).toBeNull()
  })

  it('with a photo: the description is its alt text, and nothing is faded while the event is ahead', async () => {
    await open(detail({ image: { url: `/api/events/${ID}/image?v=1`, alt: 'Foto da contação' } }))

    const image = screen.getByRole('img', { name: 'Foto da contação' })
    expect(image.getAttribute('src')).toContain(`/events/${ID}/image?v=1`)
    expect(image.className).not.toMatch(/sepia/)
  })

  it('a photo of an event that already happened is sepia', async () => {
    await open(detail({ registrationStatus: 'started', image: { url: `/api/events/${ID}/image?v=1`, alt: 'Foto da contação' } }))

    expect(screen.getByRole('img', { name: 'Foto da contação' }).className).toMatch(/sepia/)
  })

  it('has the back link to the agenda', async () => {
    await open(detail())

    expect(screen.getAllByRole('link', { name: /Agenda$/ }).some((link) => link.getAttribute('href') === '/agenda')).toBe(true)
  })

  it('puts the action bar above the bottom bar on the phone, hidden on the desktop, stacking under 24rem', async () => {
    await open(detail())

    const bar = document.querySelector('[class*="sticky"][class*="bottom-"]') as HTMLElement
    expect(bar).toHaveClass('desktop:hidden')
    expect(within(bar).getByRole('link', { name: 'Quero me inscrever' })).toBeInTheDocument()
    expect(bar.innerHTML).toContain('min-[24rem]:grid-cols')
  })

  it('has one applique at most per screen: the primary button of the card, the bar being the phone twin', async () => {
    await open(detail())

    const bar = document.querySelector('[class*="sticky"][class*="bottom-"]') as HTMLElement
    const card = document.querySelector('aside') as HTMLElement
    expect(card.querySelectorAll('[class*="shadow-applique"]').length).toBe(1)
    expect(bar.querySelectorAll('[class*="shadow-applique"]').length).toBe(1)
  })

  it('shows the 404 page for an event that does not exist', async () => {
    mock = mockApi({ [`GET /events/${ID}`]: () => apiError(404, 'event_not_found', 'Não encontramos essa atividade.') })
    renderRoute(`/agenda/${ID}`)

    expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
  })

  it('says the load failed and tries again', async () => {
    const user = userEvent.setup()
    let fail = true
    mock = mockApi({ [`GET /events/${ID}`]: () => (fail ? 'network-error' : { status: 200, data: { event: detail() } }) })
    renderRoute(`/agenda/${ID}`)

    expect(await screen.findByRole('alert')).toHaveTextContent('Não conseguimos carregar a atividade')
    fail = false
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Cafú e o Café' })).toBeInTheDocument())
  })

  it('keeps the Agenda item of the bottom bar active inside the detail', async () => {
    await open(detail())

    expect(screen.getAllByRole('link', { name: 'Agenda' }).some((link) => link.getAttribute('aria-current') === 'page')).toBe(true)
  })
})
