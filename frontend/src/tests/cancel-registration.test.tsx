import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import type { CancelPreview } from '../types/cancel-registration'
import type { EventSummary } from '../types/event'
import { apiError, mockApi } from './auth-support'
import { renderRoute } from './render'

type Handlers = Parameters<typeof mockApi>[0]

let mock: ReturnType<typeof mockApi>
afterEach(() => mock?.restore())

const CODE = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const PATH = `/inscricao/cancelar?c=${CODE}`
const KEY = `/registrations/cancel/${CODE}`

const preview = (state: CancelPreview['state'] = 'active'): CancelPreview => ({
  state,
  name: 'Ana P.',
  event: { id: 'e1', title: 'Cafú e o Café', startsAt: '2030-10-19T18:00:00.000Z', endsAt: null, location: 'Sede, Casa Verde' },
})

const other = (id: string, title: string, spotsLeft: number | null): EventSummary => ({
  id,
  title,
  description: null,
  category: null,
  startsAt: '2030-10-26T18:00:00.000Z',
  endsAt: null,
  location: null,
  ageRange: null,
  capacity: null,
  spotsLeft,
})

function serve(handlers: Handlers = {}) {
  mock = mockApi({ [`GET ${KEY}`]: () => ({ status: 200, data: { registration: preview() } }), ...handlers })
}

const calls = (key: string) => mock.requests.filter((request) => `${request.method} ${request.url}` === key)

describe('cancelling a sign-up with the personal link (designs 7c and 7d)', () => {
  it('asks first, with the event, the short name and two buttons that are equally easy to reach', async () => {
    serve()
    renderRoute(PATH)

    expect(await screen.findByRole('heading', { name: 'Cancelar a inscrição?' })).toBeInTheDocument()
    expect(screen.getByText('Cafú e o Café')).toBeInTheDocument()
    expect(screen.getByText('Inscrição de Ana P.')).toBeInTheDocument()
    expect(screen.getByText(/A vaga volta para a agenda/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sim, cancelar minha inscrição' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Manter inscrição' })).toHaveAttribute('href', '/agenda')
    expect(calls(`POST ${KEY}`)).toHaveLength(0)
  })

  it('needs no session: it asks the API with no credentials', async () => {
    serve()
    renderRoute(PATH)
    await screen.findByRole('heading', { name: 'Cancelar a inscrição?' })

    expect(calls(`GET ${KEY}`)[0]?.authorization).toBeUndefined()
  })

  it('cancels only when confirmed, says it is done, and offers other dates that still have room', async () => {
    const user = userEvent.setup()
    serve({
      [`POST ${KEY}`]: () => ({ status: 200, data: { registration: preview('cancelled') } }),
      'GET /events': () => ({ status: 200, data: { data: [other('e1', 'Cafú e o Café', 3), other('e2', 'Roda de samba das crianças', 5), other('e3', 'Lotado', 0)] } }),
    })
    renderRoute(PATH)

    await user.click(await screen.findByRole('button', { name: 'Sim, cancelar minha inscrição' }))

    expect(await screen.findByRole('heading', { name: 'Inscrição cancelada' })).toBeInTheDocument()
    expect(screen.getByText('Feito')).toBeInTheDocument()
    expect(screen.getByText(/foi liberada/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver a agenda' })).toHaveAttribute('href', '/agenda')
    expect(await screen.findByRole('link', { name: /Roda de samba das crianças/ })).toHaveAttribute('href', '/agenda/e2/inscricao')
    expect(screen.queryByRole('link', { name: /Lotado/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Cafú e o Café/ })).not.toBeInTheDocument()
    expect(calls(`POST ${KEY}`)).toHaveLength(1)
  })

  it('does not suggest another date when there is none, rather than inventing one', async () => {
    const user = userEvent.setup()
    serve({
      [`POST ${KEY}`]: () => ({ status: 200, data: { registration: preview('cancelled') } }),
      'GET /events': () => ({ status: 200, data: { data: [] } }),
    })
    renderRoute(PATH)

    await user.click(await screen.findByRole('button', { name: 'Sim, cancelar minha inscrição' }))
    await screen.findByRole('heading', { name: 'Inscrição cancelada' })

    await waitFor(() => expect(calls('GET /events')).toHaveLength(1))
    expect(screen.queryByText('Quer ir em outra data?')).not.toBeInTheDocument()
  })

  it.each([
    ['already cancelled', 'cancelled', 'Esta inscrição já foi cancelada'],
    ['over', 'over', 'Esta atividade já aconteceu'],
  ] as const)('says so, with the WhatsApp, when the sign-up is %s', async (_label, state, title) => {
    serve({ [`GET ${KEY}`]: () => ({ status: 200, data: { registration: preview(state) } }) })
    renderRoute(PATH)

    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '(11) 95396-8344' })).toHaveAttribute('href', 'https://wa.me/5511953968344')
    expect(screen.queryByRole('button', { name: /cancelar minha inscrição/ })).not.toBeInTheDocument()
  })

  it('says it was already cancelled when somebody else got there first', async () => {
    const user = userEvent.setup()
    serve({ [`POST ${KEY}`]: () => apiError(409, 'already_cancelled', 'Esta inscrição já foi cancelada.') })
    renderRoute(PATH)

    await user.click(await screen.findByRole('button', { name: 'Sim, cancelar minha inscrição' }))

    expect(await screen.findByRole('heading', { name: 'Esta inscrição já foi cancelada' })).toBeInTheDocument()
  })

  it('keeps the confirmation and says what happened when the network fails, so it can be tried again', async () => {
    const user = userEvent.setup()
    serve({ [`POST ${KEY}`]: () => 'network-error' })
    renderRoute(PATH)

    await user.click(await screen.findByRole('button', { name: 'Sim, cancelar minha inscrição' }))

    expect(await screen.findByText(/Não conseguimos falar com o servidor/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sim, cancelar minha inscrição' })).toBeEnabled()
  })

  it('says it did not find the sign-up for a code nobody has, and for a link without code, asking nothing', async () => {
    serve({ [`GET ${KEY}`]: () => apiError(404, 'registration_not_found', 'x') })
    renderRoute(PATH)
    expect(await screen.findByRole('heading', { name: 'Não encontramos esta inscrição' })).toBeInTheDocument()
    mock.restore()

    serve()
    renderRoute('/inscricao/cancelar')
    expect(await screen.findAllByRole('heading', { name: 'Não encontramos esta inscrição' })).not.toHaveLength(0)
    expect(calls(`GET ${KEY}`)).toHaveLength(0)

    renderRoute('/inscricao/cancelar?c=nao-e-um-codigo')
    expect(await screen.findAllByRole('heading', { name: 'Não encontramos esta inscrição' })).not.toHaveLength(0)
    expect(mock.requests.filter((request) => request.url.includes('nao-e-um'))).toHaveLength(0)
  })

  it('sends the cancellation and nothing about who the person is', async () => {
    const user = userEvent.setup()
    serve({ [`POST ${KEY}`]: () => ({ status: 200, data: { registration: preview('cancelled') } }), 'GET /events': () => ({ status: 200, data: { data: [] } }) })
    renderRoute(PATH)

    await user.click(await screen.findByRole('button', { name: 'Sim, cancelar minha inscrição' }))
    await screen.findByRole('heading', { name: 'Inscrição cancelada' })

    expect(calls(`POST ${KEY}`)[0]?.body).toBeUndefined()
  })
})
