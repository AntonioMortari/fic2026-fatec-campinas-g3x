import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import type { EventDetail } from '../types/event'
import { apiError, fakeUser, mockApi } from './auth-support'
import { renderRoute } from './render'

type Handlers = Parameters<typeof mockApi>[0]

let mock: ReturnType<typeof mockApi>
afterEach(() => mock?.restore())

const ID = '3b3a6c52-6b0e-4d0b-9c58-1d2a5f1c9a10'
const PATH = `/agenda/${ID}/inscricao`

const event: EventDetail = {
  id: ID,
  title: 'Cafú e o Café',
  description: null,
  category: 'Contação de história',
  startsAt: '2030-10-17T17:00:00.000Z',
  endsAt: null,
  location: 'Sede, Vila Romero',
  ageRange: 'Livre',
  capacity: 18,
  spotsLeft: 11,
  requiresCpf: false,
  registrationsOpen: true,
}

const serve = (detail: EventDetail = event, extra: Handlers = {}) => {
  mock = mockApi({ [`GET /events/${ID}`]: () => ({ status: 200, data: { event: detail } }), ...extra })
}

const CREATED = { status: 201, data: { registration: { id: 'r1', name: 'Ana Souza', cancelCode: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }, event: { ...event, spotsLeft: 10 } } }
const calls = (key: string) => mock.requests.filter((request) => `${request.method} ${request.url}` === key)
const field = (label: RegExp) => screen.getByLabelText(label)

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText(/^Nome de quem vai participar/), 'Ana Souza')
  await user.type(field(/^E-mail/), 'ana@exemplo.com')
  await user.click(field(/Concordo que o Ateliê/))
}

const submit = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole('button', { name: 'Confirmar inscrição' }))

describe('the registration screen (design 3d)', () => {
  it('shows the event at the top, promises no account, and asks only what is needed', async () => {
    serve()
    renderRoute(PATH)

    expect(await screen.findByRole('heading', { name: 'Sua inscrição' })).toBeInTheDocument()
    const summary = screen.getByRole('region', { name: 'A atividade' })
    expect(within(summary).getByText('Cafú e o Café')).toBeInTheDocument()
    expect(within(summary).getByText(/11 vagas restantes/)).toBeInTheDocument()
    expect(screen.getByText('Não precisa criar conta. Leva 1 minuto.')).toBeInTheDocument()
    expect(screen.queryByLabelText(/CPF/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/responsável/i)).not.toBeInTheDocument()
  })

  it('names where the back link goes: the agenda', async () => {
    serve()
    renderRoute(PATH)
    await screen.findByRole('heading', { name: 'Sua inscrição' })

    expect(screen.getByRole('link', { name: 'Agenda' })).toHaveAttribute('href', '/agenda')
  })

  it('asks for the CPF only when the event does', async () => {
    serve({ ...event, requiresCpf: true })
    renderRoute(PATH)

    expect(await screen.findByLabelText(/^CPF de quem vai participar/)).toBeRequired()
  })

  it('opens the guardian fields when the person is under 18, and closes them again', async () => {
    const user = userEvent.setup()
    serve()
    renderRoute(PATH)
    await screen.findByRole('heading', { name: 'Sua inscrição' })

    await user.click(field(/menos de 18 anos/))
    expect(field(/^Nome do responsável/)).toBeRequired()
    expect(field(/^Telefone do responsável/)).toBeRequired()
    expect(screen.getByLabelText(/Autorizo o uso de fotos e vídeos em que quem vai participar apareça/)).toBeInTheDocument()

    await user.click(field(/menos de 18 anos/))
    expect(screen.queryByLabelText(/responsável/i)).not.toBeInTheDocument()
  })

  it('says in writing that the image authorization is optional', async () => {
    serve()
    renderRoute(PATH)

    expect(await screen.findByLabelText(/Autorizo o uso de fotos e vídeos em que eu apareça/)).toHaveAccessibleDescription('Opcional — dá para participar sem autorizar.')
  })
})

describe('signing up without an account', () => {
  it('offers the personal link to cancel, right on the confirmation, for someone without an account', async () => {
    const user = userEvent.setup()
    serve(event, { [`POST /events/${ID}/registrations`]: () => CREATED })
    renderRoute(PATH)
    await fillValid(user)
    await submit(user)

    await screen.findByRole('heading', { name: 'Inscrição registrada' })

    expect(screen.getByRole('link', { name: /Cancelar esta inscrição/ })).toHaveAttribute('href', '/inscricao/cancelar?c=cccccccc-cccc-4ccc-8ccc-cccccccccccc')
  })

  it('sends the form, shows what was saved and never promises an e-mail', async () => {
    const user = userEvent.setup()
    serve(event, { [`POST /events/${ID}/registrations`]: () => CREATED })
    renderRoute(PATH)
    await fillValid(user)
    await submit(user)

    expect(await screen.findByRole('heading', { name: 'Inscrição registrada' })).toBeInTheDocument()
    expect(screen.getByText('Ana Souza')).toBeInTheDocument()
    expect(calls(`POST /events/${ID}/registrations`)[0]).toMatchObject({
      authorization: undefined,
      body: {
        name: 'Ana Souza',
        email: 'ana@exemplo.com',
        phone: '',
        cpf: '',
        isMinor: false,
        guardianName: '',
        guardianPhone: '',
        imageAuthorized: false,
        consent: true,
      },
    })
    expect(screen.queryByText(/e-mail de confirmação|enviamos|confirmação por e-mail/i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Agenda\s*: adicionar/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para a agenda' })).toHaveAttribute('href', '/agenda')
  })

  it('sends the guardian when it is a minor', async () => {
    const user = userEvent.setup()
    serve({ ...event, requiresCpf: true }, { [`POST /events/${ID}/registrations`]: () => CREATED })
    renderRoute(PATH)
    await fillValid(user)
    await user.type(field(/^CPF/), '529.982.247-25')
    await user.click(field(/menos de 18 anos/))
    await user.type(field(/^Nome do responsável/), 'Maria Souza')
    await user.type(field(/^Telefone do responsável/), '(11) 91234-5678')
    await user.click(field(/Autorizo o uso de fotos/))
    await submit(user)

    await screen.findByRole('heading', { name: 'Inscrição registrada' })
    expect(calls(`POST /events/${ID}/registrations`)[0]?.body).toMatchObject({
      cpf: '529.982.247-25',
      isMinor: true,
      guardianName: 'Maria Souza',
      guardianPhone: '(11) 91234-5678',
      imageAuthorized: true,
    })
  })

  it('never sends the account, the event or a role: only the form fields', async () => {
    const user = userEvent.setup()
    serve(event, { [`POST /events/${ID}/registrations`]: () => CREATED })
    renderRoute(PATH)
    await fillValid(user)
    await submit(user)
    await screen.findByRole('heading', { name: 'Inscrição registrada' })

    const keys = Object.keys(calls(`POST /events/${ID}/registrations`)[0]?.body as object).sort()
    expect(keys).toEqual(['cpf', 'consent', 'email', 'guardianName', 'guardianPhone', 'imageAuthorized', 'isMinor', 'name', 'phone'].sort())
  })

  it('lets the same person sign up somebody else right after, with a clean form', async () => {
    const user = userEvent.setup()
    serve(event, { [`POST /events/${ID}/registrations`]: () => CREATED })
    renderRoute(PATH)
    await fillValid(user)
    await submit(user)
    await user.click(await screen.findByRole('button', { name: 'Inscrever outra pessoa' }))

    expect(await screen.findByLabelText(/^Nome de quem vai participar/)).toHaveValue('')
    expect(field(/Concordo que o Ateliê/)).not.toBeChecked()
  })

  it('offers the way in for someone who has an account, coming back to this page', async () => {
    serve()
    renderRoute(PATH)
    await screen.findByRole('heading', { name: 'Sua inscrição' })

    expect(screen.getByRole('link', { name: 'Entre' })).toHaveAttribute('href', `/entrar?voltar=${encodeURIComponent(PATH)}`)
  })
})

describe('signing up with an account', () => {
  function signedIn(handlers: Handlers = {}) {
    localStorage.setItem('af-session', '1')
    serve(event, {
      'POST /auth/refresh': () => ({ status: 200, data: { token: 'a.b.c', user: { ...fakeUser, phone: '11953968344' } } }),
      ...handlers,
    })
  }

  it('fills in the data of the account, says so, and offers no way in', async () => {
    signedIn()
    renderRoute(PATH)

    expect(await screen.findByLabelText(/^Nome de quem vai participar/)).toHaveValue('Maria da Silva')
    expect(field(/^E-mail/)).toHaveValue('maria@example.com')
    expect(field(/^Telefone \(opcional\)/)).toHaveValue('(11) 95396-8344')
    expect(screen.getByText(/Você entrou como/)).toHaveTextContent('Maria da Silva')
    expect(screen.queryByRole('link', { name: 'Entre' })).not.toBeInTheDocument()
    expect(screen.queryByText('Não precisa criar conta. Leva 1 minuto.')).not.toBeInTheDocument()
  })

  it('sends the access token, so the sign-up is linked to the account', async () => {
    const user = userEvent.setup()
    signedIn({ [`POST /events/${ID}/registrations`]: () => CREATED })
    renderRoute(PATH)
    await user.click(await screen.findByLabelText(/Concordo que o Ateliê/))
    await submit(user)

    await screen.findByRole('heading', { name: 'Inscrição registrada' })
    expect(calls(`POST /events/${ID}/registrations`)[0]?.authorization).toBe('Bearer a.b.c')
  })

  it('lets the name be changed to sign somebody else up, while still linked to the account', async () => {
    const user = userEvent.setup()
    signedIn({ [`POST /events/${ID}/registrations`]: () => CREATED })
    renderRoute(PATH)
    const name = await screen.findByLabelText(/^Nome de quem vai participar/)
    await user.clear(name)
    await user.type(name, 'Filho da Maria')
    await user.click(field(/Concordo que o Ateliê/))
    await submit(user)

    await screen.findByRole('heading', { name: 'Inscrição registrada' })
    const sent = calls(`POST /events/${ID}/registrations`)[0]
    expect(sent?.body).toMatchObject({ name: 'Filho da Maria' })
    expect(sent?.authorization).toBe('Bearer a.b.c')
  })

  it('waits for the session to be restored before drawing the form, so the data is not lost', async () => {
    signedIn()
    renderRoute(PATH)

    expect(screen.getByText('Carregando sua conta…')).toBeInTheDocument()
    expect(await screen.findByLabelText(/^Nome de quem vai participar/)).toHaveValue('Maria da Silva')
  })
})

describe('when the server refuses', () => {
  it('keeps what was typed and shows the message on its field, with the focus there', async () => {
    const user = userEvent.setup()
    serve({ ...event, requiresCpf: true }, {
      [`POST /events/${ID}/registrations`]: () => apiError(400, 'invalid_data', 'Confira.', [{ field: 'cpf', message: 'Confira o CPF: ele precisa ter 11 números válidos.' }]),
    })
    renderRoute(PATH)
    await fillValid(user)
    await user.type(field(/^CPF/), '111.111.111-11')
    await submit(user)

    await waitFor(() => expect(field(/^CPF/)).toHaveAttribute('aria-invalid', 'true'))
    expect(field(/^CPF/)).toHaveAccessibleDescription('Confira o CPF: ele precisa ter 11 números válidos.')
    expect(field(/^CPF/)).toHaveFocus()
    expect(field(/^Nome de quem vai participar/)).toHaveValue('Ana Souza')
    expect(screen.getByRole('alert')).toHaveTextContent('Confira os campos destacados abaixo.')
  })

  it('shows the consent message when the box was left unchecked, and sends consent=false', async () => {
    const user = userEvent.setup()
    serve(event, {
      [`POST /events/${ID}/registrations`]: () => apiError(400, 'invalid_data', 'Confira.', [{ field: 'consent', message: 'Para se inscrever, precisamos que você concorde com o uso dos seus dados.' }]),
    })
    renderRoute(PATH)
    await user.type(await screen.findByLabelText(/^Nome de quem vai participar/), 'Ana')
    await user.type(field(/^E-mail/), 'ana@exemplo.com')
    await submit(user)

    await waitFor(() => expect(field(/Concordo que o Ateliê/)).toHaveAttribute('aria-invalid', 'true'))
    expect(calls(`POST /events/${ID}/registrations`)[0]?.body).toMatchObject({ consent: false })
  })

  it.each([
    ['already_registered', 409, 'Essa pessoa já está inscrita nesta atividade.'],
    ['too_many_registrations', 429, 'Cada e-mail pode inscrever até 5 pessoas na mesma atividade.'],
  ])('says %s in words, as an alert, with the form kept', async (code, status, message) => {
    const user = userEvent.setup()
    serve(event, { [`POST /events/${ID}/registrations`]: () => apiError(status, code, message) })
    renderRoute(PATH)
    await fillValid(user)
    await submit(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(field(/^Nome de quem vai participar/)).toHaveValue('Ana Souza')
  })

  it('moves to the "spots are over" screen when the last spot went while the person was typing', async () => {
    const user = userEvent.setup()
    let full = false
    mock = mockApi({
      [`GET /events/${ID}`]: () => ({ status: 200, data: { event: full ? { ...event, spotsLeft: 0, registrationsOpen: false } : event } }),
      [`POST /events/${ID}/registrations`]: () => {
        full = true
        return apiError(409, 'event_full', 'As vagas desta atividade acabaram.')
      },
    })
    renderRoute(PATH)
    await fillValid(user)
    await submit(user)

    expect(await screen.findByText('As vagas desta atividade acabaram')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirmar inscrição' })).not.toBeInTheDocument()
  })

  it('says a network failure as a message and keeps the form', async () => {
    const user = userEvent.setup()
    serve(event, { [`POST /events/${ID}/registrations`]: () => 'network-error' })
    renderRoute(PATH)
    await fillValid(user)
    await submit(user)

    expect(await screen.findByRole('alert')).toHaveTextContent('Não conseguimos falar com o servidor')
    expect(field(/^Nome de quem vai participar/)).toHaveValue('Ana Souza')
  })
})

describe('what cannot be signed up for', () => {
  it('shows "spots are over" with no form when the event is full', async () => {
    serve({ ...event, spotsLeft: 0, registrationsOpen: false })
    renderRoute(PATH)

    expect(await screen.findByText('As vagas desta atividade acabaram')).toBeInTheDocument()
    expect(screen.queryByLabelText(/^Nome de quem vai participar/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver a agenda' })).toHaveAttribute('href', '/agenda')
  })

  it('shows "registrations closed" with no form when the event is over', async () => {
    serve({ ...event, registrationsOpen: false })
    renderRoute(PATH)

    expect(await screen.findByText('As inscrições desta atividade já encerraram')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirmar inscrição' })).not.toBeInTheDocument()
  })

  it('shows the 404 for an event that does not exist or is not published', async () => {
    mock = mockApi({ [`GET /events/${ID}`]: () => apiError(404, 'event_not_found', 'Não encontramos essa atividade.') })
    renderRoute(PATH)

    expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
  })

  it('says it could not load, and tries again', async () => {
    const user = userEvent.setup()
    let attempts = 0
    mock = mockApi({ [`GET /events/${ID}`]: () => (++attempts === 1 ? apiError(500, 'internal_error', 'x') : { status: 200, data: { event } }) })
    renderRoute(PATH)

    await user.click(await screen.findByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByRole('heading', { name: 'Sua inscrição' })).toBeInTheDocument()
  })
})
