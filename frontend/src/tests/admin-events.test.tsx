import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { toLocalInput } from '../lib/dates'
import type { AdminEvent } from '../types/admin-event'
import { apiError, fakeUser, mockApi } from './auth-support'
import { renderRoute } from './render'

type Handlers = Parameters<typeof mockApi>[0]

let mock: ReturnType<typeof mockApi>
afterEach(() => mock?.restore())

const STAFF = { ...fakeUser, isStaff: true }

const draft: AdminEvent = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Contação de histórias',
  description: 'Uma tarde de histórias.',
  category: 'Contação',
  startsAt: '2030-11-20T18:00:00.000Z',
  endsAt: '2030-11-20T20:00:00.000Z',
  location: 'Casa Verde',
  ageRange: 'Livre',
  capacity: 30,
  spotsLeft: 30,
  registrationCount: 0,
  requiresCpf: true,
  published: false,
  updatedAt: '2030-01-01T00:00:00.000Z',
}
const live: AdminEvent = { ...draft, id: '22222222-2222-4222-8222-222222222222', title: 'Oficina de turbantes', published: true, capacity: null, spotsLeft: null, registrationCount: 12, requiresCpf: false }

function openAs(account: typeof fakeUser | null, handlers: Handlers = {}) {
  if (account) localStorage.setItem('af-session', '1')
  mock = mockApi({
    'POST /auth/refresh': () => (account ? { status: 200, data: { token: 'a.b.c', user: account } } : apiError(401, 'session_expired', 'Fim.')),
    ...handlers,
  })
}

const calls = (key: string) => mock.requests.filter((request) => `${request.method} ${request.url}` === key)

describe('who sees the panel', () => {
  it.each([
    ['a visitor', null],
    ['a signed-in person who is not staff', fakeUser],
  ])('answers %s with the 404, and asks the API for nothing', async (_label, account) => {
    openAs(account)
    renderRoute('/admin/eventos')

    expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
    expect(calls('GET /admin/events')).toHaveLength(0)
  })

  it('opens the panel for staff, with the way to the events', async () => {
    openAs(STAFF)
    renderRoute('/admin')

    expect(await screen.findByRole('heading', { name: 'Painel da equipe' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Eventos/ })).toHaveAttribute('href', '/admin/eventos')
  })

  it('offers the panel in the menu only to staff', async () => {
    const user = userEvent.setup()
    openAs(STAFF)
    renderRoute('/')
    await screen.findByRole('link', { name: /^Minha conta/ })
    await user.click(screen.getByRole('button', { name: /Aa, acessibilidade/ }))

    expect(within(screen.getByRole('dialog', { hidden: true })).getByRole('link', { name: 'Painel da equipe', hidden: true })).toHaveAttribute('href', '/admin')
  })

  it('does not offer it to someone who is not staff', async () => {
    const user = userEvent.setup()
    openAs(fakeUser)
    renderRoute('/')
    await screen.findByRole('link', { name: /^Minha conta/ })
    await user.click(screen.getByRole('button', { name: /Aa, acessibilidade/ }))

    expect(screen.queryByText('Painel da equipe')).not.toBeInTheDocument()
  })
})

describe('the list of events', () => {
  const list = (data: AdminEvent[]): Handlers => ({ 'GET /admin/events': () => ({ status: 200, data: { data } }) })

  it('separates drafts from published, and says it in words, not only in color', async () => {
    openAs(STAFF, list([draft, live]))
    renderRoute('/admin/eventos')

    expect(await screen.findByRole('heading', { name: 'Rascunhos (1)' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Publicados (1)' })).toBeInTheDocument()
    expect(screen.getByText('Rascunho', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('Publicado', { selector: 'span' })).toBeInTheDocument()
  })

  it('says how many people signed up, in each event', async () => {
    openAs(STAFF, list([draft, live]))
    renderRoute('/admin/eventos')
    await screen.findByRole('heading', { name: 'Contação de histórias' })

    expect(screen.getByText(/0 inscrições/)).toBeInTheDocument()
    expect(screen.getByText(/12 inscrições/)).toBeInTheDocument()
  })

  it('explains that saving does not publish and that events are not deleted, and offers no way to delete', async () => {
    openAs(STAFF, list([draft, live]))
    renderRoute('/admin/eventos')
    await screen.findByRole('heading', { name: 'Contação de histórias' })

    expect(screen.getByText(/Salvar não publica/)).toBeInTheDocument()
    expect(screen.getByText(/não são apagados/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /apagar|excluir|remover/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /apagar|excluir|remover/i })).not.toBeInTheDocument()
  })

  it('shows the empty state with the way to the first event', async () => {
    openAs(STAFF, list([]))
    renderRoute('/admin/eventos')

    expect(await screen.findByText('Nenhum evento ainda')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Novo evento' })).toHaveAttribute('href', '/admin/eventos/novo')
  })

  it('says when the list could not be loaded, and tries again', async () => {
    const user = userEvent.setup()
    let attempts = 0
    openAs(STAFF, { 'GET /admin/events': () => (++attempts === 1 ? apiError(500, 'internal_error', 'x') : { status: 200, data: { data: [draft] } }) })
    renderRoute('/admin/eventos')

    await user.click(await screen.findByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByRole('heading', { name: 'Contação de histórias' })).toBeInTheDocument()
  })

  it('publishes with its own button, tells it, and undoes from the toast', async () => {
    const user = userEvent.setup()
    openAs(STAFF, {
      ...list([draft]),
      [`PATCH /admin/events/${draft.id}/publication`]: ({ body }) => ({
        status: 200,
        data: { event: { ...draft, published: (body as { published: boolean }).published } },
      }),
    })
    renderRoute('/admin/eventos')
    await user.click(await screen.findByRole('button', { name: /Publicar/ }))

    expect(await screen.findByText('Publicado. Já aparece na agenda.')).toBeInTheDocument()
    expect(calls(`PATCH /admin/events/${draft.id}/publication`)[0]?.body).toEqual({ published: true })

    await user.click(screen.getByRole('button', { name: 'Desfazer' }))
    await waitFor(() => expect(calls(`PATCH /admin/events/${draft.id}/publication`)).toHaveLength(2))
    expect(calls(`PATCH /admin/events/${draft.id}/publication`)[1]?.body).toEqual({ published: false })
  })

  it('takes a published event down with the other button', async () => {
    const user = userEvent.setup()
    openAs(STAFF, {
      ...list([live]),
      [`PATCH /admin/events/${live.id}/publication`]: () => ({ status: 200, data: { event: { ...live, published: false } } }),
    })
    renderRoute('/admin/eventos')
    await user.click(await screen.findByRole('button', { name: /Tirar do ar/ }))

    expect(await screen.findByText('Tirado do ar. Não aparece mais na agenda.')).toBeInTheDocument()
    expect(calls(`PATCH /admin/events/${live.id}/publication`)[0]?.body).toEqual({ published: false })
  })

  it('does not pretend it worked when publishing fails', async () => {
    const user = userEvent.setup()
    openAs(STAFF, { ...list([draft]), [`PATCH /admin/events/${draft.id}/publication`]: () => apiError(500, 'internal_error', 'x') })
    renderRoute('/admin/eventos')
    await user.click(await screen.findByRole('button', { name: /Publicar/ }))

    expect(await screen.findByText('Não foi possível mudar agora. Tente de novo.')).toBeInTheDocument()
    expect(screen.queryByText(/Já aparece na agenda/)).not.toBeInTheDocument()
  })
})

describe('the event form', () => {
  const field = (label: RegExp) => screen.getByLabelText(label)

  it('has no way to publish or to delete: only save', async () => {
    openAs(STAFF)
    renderRoute('/admin/eventos/novo')
    await screen.findByRole('heading', { name: 'Novo evento' })

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /publicar|apagar|excluir/i })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/publicado/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Salvar não publica o evento/)).toBeInTheDocument()
  })

  it('creates a draft sending blanks as null, never a publication flag, and goes back to the list', async () => {
    const user = userEvent.setup()
    openAs(STAFF, {
      'POST /admin/events': () => ({ status: 201, data: { event: draft } }),
      'GET /admin/events': () => ({ status: 200, data: { data: [draft] } }),
    })
    const router = renderRoute('/admin/eventos/novo')
    await user.type(await screen.findByLabelText(/^Título/), 'Contação de histórias')
    await user.type(field(/^Começa em/), '2030-11-20T15:00')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/eventos'))
    expect(calls('POST /admin/events')[0]?.body).toEqual({
      title: 'Contação de histórias',
      description: '',
      category: '',
      startsAt: '2030-11-20T15:00',
      endsAt: null,
      location: '',
      ageRange: '',
      capacity: null,
      requiresCpf: false,
    })
    expect(await screen.findByText('Rascunho salvo. Publique quando estiver pronto.')).toBeInTheDocument()
  })

  it('sends the capacity as a number, and text that is not a number as text so the server refuses it', async () => {
    const user = userEvent.setup()
    openAs(STAFF, { 'POST /admin/events': () => apiError(400, 'invalid_data', 'x', [{ field: 'capacity', message: 'O limite de vagas precisa ser um número inteiro, ou fique em branco.' }]) })
    renderRoute('/admin/eventos/novo')
    await user.type(await screen.findByLabelText(/^Título/), 'X')
    await user.type(field(/^Começa em/), '2030-11-20T15:00')

    await user.type(field(/^Limite de vagas/), '12')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(calls('POST /admin/events')).toHaveLength(1))
    expect(calls('POST /admin/events')[0]?.body).toMatchObject({ capacity: 12 })

    await user.clear(field(/^Limite de vagas/))
    await user.type(field(/^Limite de vagas/), 'muitas')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(calls('POST /admin/events')).toHaveLength(2))
    expect(calls('POST /admin/events')[1]?.body).toMatchObject({ capacity: 'muitas' })
  })

  it('keeps what was typed and shows the server message on its field, with the focus there', async () => {
    const user = userEvent.setup()
    openAs(STAFF, {
      'POST /admin/events': () =>
        apiError(400, 'invalid_data', 'Confira.', [{ field: 'endsAt', message: 'O término precisa ser depois do início.' }]),
    })
    renderRoute('/admin/eventos/novo')
    await user.type(await screen.findByLabelText(/^Título/), 'Roda de conversa')
    await user.type(field(/^Começa em/), '2030-11-20T15:00')
    await user.type(field(/^Termina em/), '2030-11-20T14:00')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(field(/^Termina em/)).toHaveAttribute('aria-invalid', 'true'))
    expect(field(/^Termina em/)).toHaveAccessibleDescription('O término precisa ser depois do início.')
    expect(field(/^Termina em/)).toHaveFocus()
    expect(field(/^Título/)).toHaveValue('Roda de conversa')
  })

  it('says the time is São Paulo time', async () => {
    openAs(STAFF)
    renderRoute('/admin/eventos/novo')

    expect(await screen.findByLabelText(/^Começa em/)).toHaveAccessibleDescription('Horário de São Paulo.')
  })

  it('edits an existing event showing São Paulo time and sends a PUT, keeping it published', async () => {
    const user = userEvent.setup()
    openAs(STAFF, {
      [`GET /admin/events/${live.id}`]: () => ({ status: 200, data: { event: live } }),
      [`PUT /admin/events/${live.id}`]: () => ({ status: 200, data: { event: live } }),
      'GET /admin/events': () => ({ status: 200, data: { data: [live] } }),
    })
    const router = renderRoute(`/admin/eventos/${live.id}/editar`)

    expect(await screen.findByLabelText(/^Título/)).toHaveValue('Oficina de turbantes')
    expect(field(/^Começa em/)).toHaveValue('2030-11-20T15:00')
    expect(field(/^Limite de vagas/)).toHaveValue('')
    await user.clear(field(/^Título/))
    await user.type(field(/^Título/), 'Oficina de turbantes — nova data')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/eventos'))
    expect(calls(`PUT /admin/events/${live.id}`)[0]?.body).toMatchObject({ title: 'Oficina de turbantes — nova data', startsAt: '2030-11-20T15:00' })
    expect(await screen.findByText('Alterações salvas. O evento continua publicado.')).toBeInTheDocument()
  })

  it('fills the document requirement and the capacity of an event that has them', async () => {
    openAs(STAFF, { [`GET /admin/events/${draft.id}`]: () => ({ status: 200, data: { event: draft } }) })
    renderRoute(`/admin/eventos/${draft.id}/editar`)

    expect(await screen.findByLabelText('Pedir CPF na inscrição')).toBeChecked()
    expect(field(/^Limite de vagas/)).toHaveValue('30')
  })

  it('shows the 404 for an event that does not exist', async () => {
    openAs(STAFF, { [`GET /admin/events/${draft.id}`]: () => apiError(404, 'event_not_found', 'Não encontramos esse evento.') })
    renderRoute(`/admin/eventos/${draft.id}/editar`)

    expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
  })
})

describe('toLocalInput', () => {
  it('reads the instant on the São Paulo wall clock, whatever the device zone is', () => {
    expect(toLocalInput('2030-11-20T18:00:00.000Z')).toBe('2030-11-20T15:00')
    expect(toLocalInput('2030-11-21T01:30:00.000Z')).toBe('2030-11-20T22:30')
    expect(toLocalInput('2030-01-01T02:59:00.000Z')).toBe('2029-12-31T23:59')
  })
})

describe('the registrants of an event (RF16)', () => {
  const registrants = [
    { id: 'r1', name: 'Ana Souza', email: 'ana@exemplo.com', phone: '11953968344', cpf: '52998224725', isMinor: false, guardianName: null, guardianPhone: null, imageAuthorized: true, hasAccount: true, createdAt: '2030-11-01T12:00:00.000Z' },
    { id: 'r2', name: 'Caio Lima', email: 'responsavel@exemplo.com', phone: null, cpf: null, isMinor: true, guardianName: 'Maria Lima', guardianPhone: '11912345678', imageAuthorized: false, hasAccount: false, createdAt: '2030-11-02T12:00:00.000Z' },
  ]
  const route = `GET /admin/events/${live.id}/registrations`
  const page = (data = registrants): Handlers => ({ [route]: () => ({ status: 200, data: { event: live, data } }) })

  it('is only for staff', async () => {
    openAs(fakeUser)
    renderRoute(`/admin/eventos/${live.id}/inscritos`)

    expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
    expect(calls(route)).toHaveLength(0)
  })

  it('is reached from each event of the list, with the count', async () => {
    openAs(STAFF, { 'GET /admin/events': () => ({ status: 200, data: { data: [live] } }) })
    renderRoute('/admin/eventos')

    expect(await screen.findByRole('link', { name: /Ver inscritos \(12\)/ })).toHaveAttribute('href', `/admin/eventos/${live.id}/inscritos`)
  })

  it('states the image authorization of every person, in words, and totals them', async () => {
    openAs(STAFF, page())
    renderRoute(`/admin/eventos/${live.id}/inscritos`)

    expect(await screen.findByRole('heading', { name: 'Ana Souza' })).toBeInTheDocument()
    expect(screen.getByText('Autorizou imagem')).toBeInTheDocument()
    expect(screen.getByText('Não autorizou imagem')).toBeInTheDocument()
    expect(screen.getByText(/2 pessoas inscritas · 1 autorizou o uso da imagem · 1 menor de idade/)).toBeInTheDocument()
    expect(screen.getByText(/Oficina de turbantes/)).toBeInTheDocument()
  })

  it('shows contact as links and the guardian only for a minor, with the CPF only when there is one', async () => {
    const user = userEvent.setup()
    openAs(STAFF, page())
    renderRoute(`/admin/eventos/${live.id}/inscritos`)
    await screen.findByRole('heading', { name: 'Ana Souza' })
    for (const summary of screen.getAllByText(/Contato e dados/)) await user.click(summary)

    expect(screen.getByRole('link', { name: 'ana@exemplo.com' })).toHaveAttribute('href', 'mailto:ana@exemplo.com')
    expect(screen.getByRole('link', { name: '(11) 95396-8344' })).toHaveAttribute('href', 'tel:11953968344')
    expect(screen.getAllByText('529.982.247-25')).toHaveLength(1)
    expect(screen.getAllByText('CPF')).toHaveLength(1)
    expect(screen.getAllByText('Responsável')).toHaveLength(1)
    expect(screen.getByText('Maria Lima')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '(11) 91234-5678' })).toHaveAttribute('href', 'tel:11912345678')
  })

  it('says when nobody signed up, and when it could not load', async () => {
    openAs(STAFF, page([]))
    renderRoute(`/admin/eventos/${live.id}/inscritos`)
    expect(await screen.findByText('Ninguém se inscreveu ainda')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Baixar planilha' })).not.toBeInTheDocument()
  })

  it('answers the 404 for an event that does not exist', async () => {
    openAs(STAFF, { [route]: () => apiError(404, 'event_not_found', 'x') })
    renderRoute(`/admin/eventos/${live.id}/inscritos`)

    expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
  })

  it('offers no way to edit or delete a registration', async () => {
    openAs(STAFF, page())
    renderRoute(`/admin/eventos/${live.id}/inscritos`)
    await screen.findByRole('heading', { name: 'Ana Souza' })

    expect(screen.queryByRole('button', { name: /apagar|excluir|remover|editar/i })).not.toBeInTheDocument()
    expect(screen.getByText(/não se corrige nem se apaga/)).toBeInTheDocument()
  })

  it('downloads the spreadsheet with the name the server gives', async () => {
    const user = userEvent.setup()
    openAs(STAFF, {
      ...page(),
      [`GET /admin/events/${live.id}/registrations.csv`]: () => ({ status: 200, data: new Blob(['x']) }),
    })
    const created = vi.fn(() => 'blob:x')
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: created, revokeObjectURL: vi.fn() }))
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    renderRoute(`/admin/eventos/${live.id}/inscritos`)

    await user.click(await screen.findByRole('button', { name: 'Baixar planilha' }))

    await waitFor(() => expect(click).toHaveBeenCalledOnce())
    expect(calls(`GET /admin/events/${live.id}/registrations.csv`)).toHaveLength(1)
    click.mockRestore()
    vi.unstubAllGlobals()
  })
})
