import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { parsePage, queueDate } from '../lib/contacts-admin'
import type { AdminContact, ContactCounts } from '../types/contacts'
import { apiError, fakeUser, mockApi } from './auth-support'
import { renderRoute } from './render'

type Handlers = Parameters<typeof mockApi>[0]

let mock: ReturnType<typeof mockApi>
afterEach(() => {
  mock?.restore()
  vi.unstubAllGlobals()
})

const STAFF = { ...fakeUser, isStaff: true }
const HOUR = 60 * 60 * 1000
const ago = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString()

const entry = (overrides: Partial<AdminContact> = {}): AdminContact => ({
  id: 'c1',
  status: 'new',
  name: 'Regina Lima',
  email: 'regina@exemplo.com',
  phone: '11976543210',
  institution: 'EMEF Jardim São Bento',
  message: 'Gostaríamos de levar duas turmas do 3º ano para a contação de histórias em novembro.',
  staffNote: null,
  createdAt: '2026-10-08T13:42:00.000Z',
  ...overrides,
})

const JULIANA = entry({ id: 'j1', name: 'Juliana Alves', institution: null, phone: null, message: 'Quero saber os horários\nda oficina de turbantes.', createdAt: ago(1) })
const EMEF = entry({ id: 'c1', createdAt: ago(72) })
const COLEGIO = entry({ id: 'k1', status: 'in_contact', name: 'Ana Souza', institution: 'Colégio Santa Inês', staffNote: 'ligar na segunda', createdAt: '2026-01-12T12:00:00.000Z' })
const RADIO = entry({ id: 'r1', status: 'done', name: 'Paulo', institution: 'Rádio Comunitária Casa Verde', createdAt: '2025-03-10T12:00:00.000Z' })
const QUEUE = [JULIANA, EMEF, COLEGIO, RADIO]
const COUNTS: ContactCounts = { all: 4, new: 2, in_contact: 1, done: 1 }

function pagination(total = QUEUE.length, page = 1) {
  return { page, pageSize: 20, total, totalPages: Math.max(1, Math.ceil(total / 20)) }
}

function listing(rows: AdminContact[] = QUEUE): Handlers {
  return {
    'GET /admin/contacts': (request) => {
      const { status, page } = (request.params ?? {}) as { status?: string; page?: number }
      const data = rows.filter((row) => !status || row.status === status)
      return { status: 200, data: { data, counts: COUNTS, pagination: pagination(data.length, page ?? 1) } }
    },
    'GET /admin/contacts/counts': () => ({ status: 200, data: { counts: COUNTS } }),
    ...Object.fromEntries(rows.map((row) => [`GET /admin/contacts/${row.id}`, () => ({ status: 200, data: { contact: row } })])),
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

describe('the message queue is for staff only', () => {
  it('answers the 404 of the public site to someone who is not staff, and asks the API for nothing', async () => {
    open(listing(), { account: fakeUser })
    renderRoute('/admin/contatos')

    expect(await screen.findByText(/Página não encontrada|não encontrad/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Mensagens' })).not.toBeInTheDocument()
    expect(calls('GET /admin/contacts')).toHaveLength(0)
  })

  it('does the same for the screen of one message', async () => {
    open(listing(), { account: fakeUser })
    renderRoute('/admin/contatos/c1')

    await screen.findByText(/Página não encontrada|não encontrad/i)
    expect(calls('GET /admin/contacts/c1')).toHaveLength(0)
  })
})

describe('the queue on the phone (design 10m)', () => {
  it('opens with the title, the lead and the export, and lists who wrote with date and the first line', async () => {
    open()
    renderRoute('/admin/contatos')

    expect(await screen.findByRole('heading', { level: 1, name: 'Mensagens' })).toBeInTheDocument()
    expect(screen.getByText('Tudo que chega pelo formulário da página de contato do site aparece aqui.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exportar CSV' })).toBeInTheDocument()
    const rows = within(await screen.findByRole('list', { name: 'Mensagens' })).getAllByRole('listitem')
    expect(rows).toHaveLength(4)
    expect(rows[0]).toHaveTextContent('Juliana Alves')
    expect(rows[0]).toHaveTextContent('hoje')
    expect(rows[0]).toHaveTextContent('Quero saber os horários da oficina de turbantes.')
    expect(rows[1]).toHaveTextContent('EMEF Jardim São Bento')
    expect(rows[1]).toHaveTextContent('há 3 dias')
    expect(rows[2]).toHaveTextContent('Colégio Santa Inês')
    expect(rows[2]).toHaveTextContent('12 jan')
    expect(rows[3]).toHaveTextContent('mar 2025')
  })

  it('titles each row with the institution when there is one, and the person otherwise', async () => {
    open()
    renderRoute('/admin/contatos')

    const rows = within(await screen.findByRole('list', { name: 'Mensagens' })).getAllByRole('listitem')
    expect(within(rows[0]!).getByText('Juliana Alves')).toBeInTheDocument()
    expect(within(rows[1]!).getByText('EMEF Jardim São Bento')).toBeInTheDocument()
    expect(within(rows[1]!).queryByText('Regina Lima')).not.toBeInTheDocument()
  })

  it('draws the situation in each row with the words of the staff and greys out the done ones without hiding them', async () => {
    open()
    renderRoute('/admin/contatos')

    const rows = within(await screen.findByRole('list', { name: 'Mensagens' })).getAllByRole('listitem')
    expect(within(rows[0]!).getByText('Nova')).toBeInTheDocument()
    expect(within(rows[2]!).getByText('Em contato')).toBeInTheDocument()
    expect(within(rows[3]!).getByText('Concluída')).toBeInTheDocument()
    expect(within(rows[3]!).getByText('Rádio Comunitária Casa Verde')).toHaveClass('text-brown-400')
    expect(within(rows[0]!).getByText('Juliana Alves')).not.toHaveClass('text-brown-400')
  })

  it('draws the chips with the count of each situation and no count on "Todas"', async () => {
    open()
    renderRoute('/admin/contatos')

    const group = within(await screen.findByRole('group', { name: 'Situação' }))
    await waitFor(() => expect(group.getAllByRole('button').map((button) => button.textContent)).toEqual(['Todas', 'Novas · 2', 'Em contato · 1', 'Concluídas · 1']))
    expect(group.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('asks the API for the chosen situation, from the first page, and keeps it in the address', async () => {
    const user = userEvent.setup()
    open()
    const router = renderRoute('/admin/contatos?pagina=2')
    await screen.findByRole('list', { name: 'Mensagens' })

    await user.click(screen.getByRole('button', { name: 'Em contato · 1' }))

    await waitFor(() => expect(calls('GET /admin/contacts').at(-1)?.params).toEqual({ status: 'in_contact', page: 1 }))
    expect(router.state.location.search).toBe('?status=in_contact')
    expect(calls('GET /admin/contacts').some((request) => JSON.stringify(request.params) === '{"status":"in_contact","page":2}')).toBe(false)
    expect(screen.getByRole('button', { name: 'Em contato · 1' })).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => expect(within(screen.getByRole('list', { name: 'Mensagens' })).getAllByRole('listitem')).toHaveLength(1))
  })

  it('goes back to everything with "Todas"', async () => {
    const user = userEvent.setup()
    open()
    const router = renderRoute('/admin/contatos?status=done')
    await screen.findByRole('list', { name: 'Mensagens' })

    await user.click(screen.getByRole('button', { name: 'Todas' }))

    await waitFor(() => expect(calls('GET /admin/contacts').at(-1)?.params).toEqual({ page: 1 }))
    expect(router.state.location.search).toBe('')
  })

  it.each(['status=zzz', 'pagina=abc', 'pagina=0', 'pagina=-3', 'pagina=1.5'])('ignores a garbage address (%s) and asks for the first page of everything', async (query) => {
    open()
    renderRoute(`/admin/contatos?${query}`)

    await screen.findByRole('list', { name: 'Mensagens' })
    expect(calls('GET /admin/contacts').every((request) => JSON.stringify(request.params) === '{"page":1}')).toBe(true)
  })

  it('says nobody wrote yet, when there is nothing', async () => {
    open(listing([]))
    renderRoute('/admin/contatos')

    expect(await screen.findByText('Nenhuma mensagem ainda')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Mensagens' })).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Páginas da fila' })).not.toBeInTheDocument()
  })

  it('says nothing matches the filter, which is not the same as nobody writing', async () => {
    const user = userEvent.setup()
    open(listing([JULIANA, EMEF]))
    renderRoute('/admin/contatos')
    await screen.findByRole('list', { name: 'Mensagens' })

    await user.click(screen.getByRole('button', { name: 'Concluídas · 1' }))

    expect(await screen.findByText('Nenhuma mensagem com esse filtro')).toBeInTheDocument()
    expect(screen.queryByText('Nenhuma mensagem ainda')).not.toBeInTheDocument()
  })

  it('says it is loading, and says when it could not load, and tries again', async () => {
    const user = userEvent.setup()
    let attempts = 0
    open({
      ...listing(),
      'GET /admin/contacts': () => (++attempts === 1 ? 'network-error' : { status: 200, data: { data: QUEUE, counts: COUNTS, pagination: pagination() } }),
    })
    renderRoute('/admin/contatos')

    expect(await screen.findByText('Carregando as mensagens…')).toBeInTheDocument()
    expect(await screen.findByText('Não conseguimos carregar as mensagens')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByRole('list', { name: 'Mensagens' })).toBeInTheDocument()
  })

  it('opens a message on its own screen, keeping the filter in the address', async () => {
    const user = userEvent.setup()
    open()
    const router = renderRoute('/admin/contatos?status=new')
    await screen.findByRole('list', { name: 'Mensagens' })

    await user.click(screen.getByRole('link', { name: /Juliana Alves/ }))

    expect(router.state.location.pathname).toBe('/admin/contatos/j1')
    expect(router.state.location.search).toBe('?status=new')
  })

  it('explains the screen in a closed fold', async () => {
    open()
    renderRoute('/admin/contatos')

    const fold = (await screen.findByText('Como funciona esta tela')).closest('details')!
    expect(fold).not.toHaveAttribute('open')
    expect(within(fold).getByText(/novas, depois em contato, depois concluídas/)).toBeInTheDocument()
  })
})

describe('the pages of the queue', () => {
  const many = Array.from({ length: 20 }, (_, index) => entry({ id: `m${index}`, name: `Pessoa ${index}`, institution: null }))

  function paged(page: number, totalPages: number): Handlers {
    return {
      ...listing(many),
      'GET /admin/contacts': () => ({
        status: 200,
        data: { data: many, counts: COUNTS, pagination: { page, pageSize: 20, total: totalPages * 20 - 5, totalPages } },
      }),
    }
  }

  it('says which page it is on and links to the next one, with the previous one disabled on the first', async () => {
    open(paged(1, 3))
    renderRoute('/admin/contatos')

    const pager = within(await screen.findByRole('navigation', { name: 'Páginas da fila' }))
    expect(pager.getByText('Página 1 de 3')).toBeInTheDocument()
    expect(pager.getByRole('link', { name: /Próximas/ })).toHaveAttribute('href', '/admin/contatos?pagina=2')
    expect(pager.queryByRole('link', { name: /Anteriores/ })).not.toBeInTheDocument()
    expect(pager.getByText(/Anteriores/)).toHaveAttribute('aria-disabled', 'true')
  })

  it('asks the API for the page of the address, and keeps the situation when it links to the previous one', async () => {
    open(paged(3, 3))
    renderRoute('/admin/contatos?status=new&pagina=3')

    const pager = within(await screen.findByRole('navigation', { name: 'Páginas da fila' }))
    expect(calls('GET /admin/contacts')[0]!.params).toEqual({ status: 'new', page: 3 })
    expect(pager.getByRole('link', { name: /Anteriores/ })).toHaveAttribute('href', '/admin/contatos?status=new&pagina=2')
    expect(pager.getByText(/Próximas/)).toHaveAttribute('aria-disabled', 'true')
  })

  it('links the first page without the page parameter', async () => {
    open(paged(2, 2))
    renderRoute('/admin/contatos')

    const pager = within(await screen.findByRole('navigation', { name: 'Páginas da fila' }))
    expect(pager.getByRole('link', { name: /Anteriores/ })).toHaveAttribute('href', '/admin/contatos')
  })

  it('steps back to the last page when the one in the address no longer exists', async () => {
    const router = (() => {
      open({
        ...listing(),
        'GET /admin/contacts': (request) => {
          const page = (request.params as { page: number }).page
          return page > 1
            ? { status: 200, data: { data: [], counts: COUNTS, pagination: { page, pageSize: 20, total: 4, totalPages: 1 } } }
            : { status: 200, data: { data: QUEUE, counts: COUNTS, pagination: pagination() } }
        },
      })
      return renderRoute('/admin/contatos?pagina=5')
    })()

    await waitFor(() => expect(router.state.location.search).toBe(''))
    expect(await screen.findByRole('list', { name: 'Mensagens' })).toBeInTheDocument()
  })
})

describe('the screen of one message (design 10n)', () => {
  it('shows the kind and moment, the institution as title, who wrote, the contact as links and the whole message', async () => {
    open({ ...listing(), 'GET /admin/contacts/c1': () => ({ status: 200, data: { contact: entry() } }) })
    renderRoute('/admin/contatos/c1')

    expect(await screen.findByRole('heading', { name: 'EMEF Jardim São Bento' })).toBeInTheDocument()
    expect(screen.getByText(/^Contato ·/)).toHaveTextContent(/Contato · 8 out, 10:42/)
    expect(screen.getByText('Regina Lima')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'regina@exemplo.com' })).toHaveAttribute('href', 'mailto:regina@exemplo.com')
    expect(screen.getByRole('link', { name: '(11) 97654-3210' })).toHaveAttribute('href', 'tel:11976543210')
    expect(document.querySelector('blockquote')).toHaveTextContent('Gostaríamos de levar duas turmas do 3º ano para a contação de histórias em novembro.')
  })

  it('titles the screen with the person when there is no institution, and does not repeat the name', async () => {
    open()
    renderRoute('/admin/contatos/j1')

    expect(await screen.findByRole('heading', { name: 'Juliana Alves' })).toBeInTheDocument()
    expect(screen.queryByText('Quem escreveu')).not.toBeInTheDocument()
    expect(document.querySelector('dl')).not.toHaveTextContent('Juliana')
  })

  it('has the way back to the queue with the filter, the panel badge, and no public bottom bar', async () => {
    open()
    renderRoute('/admin/contatos/c1?status=new&pagina=2')

    await screen.findByRole('heading', { name: 'EMEF Jardim São Bento' })
    const back = screen.getAllByRole('link', { name: /Mensagens/ }).find((link) => link.getAttribute('href')?.startsWith('/admin/contatos?'))
    expect(back).toHaveAttribute('href', '/admin/contatos?status=new&pagina=2')
    expect(within(screen.getByRole('region', { name: 'Mensagem escolhida' })).getByText('Painel')).toBeInTheDocument()
    expect(screen.queryByText('Equipe')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Atalhos do painel' })).not.toBeInTheDocument()
  })

  it('offers the e-mail and the WhatsApp of the person, the second in a new tab', async () => {
    open()
    renderRoute('/admin/contatos/c1')

    const mail = await screen.findByRole('link', { name: /Responder por e-mail|E-mail/ })
    expect(mail).toHaveAttribute('href', 'mailto:regina@exemplo.com')
    const whats = screen.getByRole('link', { name: /WhatsApp/ })
    expect(whats).toHaveAttribute('href', 'https://wa.me/5511976543210')
    expect(whats).toHaveAttribute('target', '_blank')
  })

  it('disables the WhatsApp, and says why in words, when the person gave no phone', async () => {
    open()
    renderRoute('/admin/contatos/j1')

    expect(await screen.findByRole('heading', { name: 'Juliana Alves' })).toBeInTheDocument()
    expect(screen.getByText('Não informado')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /WhatsApp/ })).not.toBeInTheDocument()
    const button = screen.getByRole('button', { name: /WhatsApp indisponível: a pessoa não informou telefone/ })
    expect(button).toBeDisabled()
  })

  it('shows the situation as one of three, with the right one chosen, and the hint that it can be undone', async () => {
    open()
    renderRoute('/admin/contatos/k1')

    const group = within(await screen.findByRole('group', { name: 'Em que pé está' }))
    expect(group.getAllByRole('radio').map((radio) => radio.closest('label')?.textContent)).toEqual(['Nova', 'Em contato', 'Concluída'])
    expect(group.getByRole('radio', { name: 'Em contato' })).toBeChecked()
    expect(screen.getByText('Dá para voltar atrás.')).toBeInTheDocument()
  })

  it.each([
    ['j1', 'Marcar "em contato"', 'in_contact'],
    ['k1', 'Marcar "concluída"', 'done'],
    ['r1', 'Reabrir', 'in_contact'],
  ])('has as the main action for %s the natural next step: %s', async (id, label, next) => {
    const user = userEvent.setup()
    open({
      ...listing(),
      [`PATCH /admin/contacts/${id}`]: () => ({ status: 200, data: { contact: { ...QUEUE.find((row) => row.id === id)!, status: next } } }),
    })
    renderRoute(`/admin/contatos/${id}`)

    await user.click(await screen.findByRole('button', { name: label }))

    await waitFor(() => expect(calls(`PATCH /admin/contacts/${id}`)).toHaveLength(1))
    expect(calls(`PATCH /admin/contacts/${id}`)[0]!.body).toEqual({ status: next })
  })

  it('moves to any of the three situations from the chooser, sending only the status', async () => {
    const user = userEvent.setup()
    open({ ...listing(), 'PATCH /admin/contacts/j1': () => ({ status: 200, data: { contact: { ...JULIANA, status: 'done' } } }) })
    renderRoute('/admin/contatos/j1')

    await user.click(await screen.findByRole('radio', { name: 'Concluída' }))

    await waitFor(() => expect(calls('PATCH /admin/contacts/j1')).toHaveLength(1))
    expect(calls('PATCH /admin/contacts/j1')[0]!.body).toEqual({ status: 'done' })
  })

  it('confirms the change with an undo that puts the previous situation back', async () => {
    const user = userEvent.setup()
    open({
      ...listing(),
      'PATCH /admin/contacts/j1': (request) => ({ status: 200, data: { contact: { ...JULIANA, status: (request.body as { status: string }).status } } }),
    })
    renderRoute('/admin/contatos/j1')

    await user.click(await screen.findByRole('radio', { name: 'Concluída' }))
    expect(await screen.findByText('Juliana Alves: concluída.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Desfazer' }))

    await waitFor(() => expect(calls('PATCH /admin/contacts/j1')).toHaveLength(2))
    expect(calls('PATCH /admin/contacts/j1').map((request) => request.body)).toEqual([{ status: 'done' }, { status: 'new' }])
    expect(await screen.findByRole('radio', { name: 'Nova' })).toBeChecked()
  })

  it('says why, and keeps the old situation, when the server refuses', async () => {
    const user = userEvent.setup()
    open({ ...listing(), 'PATCH /admin/contacts/j1': () => apiError(500, 'internal_error', 'Algo deu errado do nosso lado. Tente de novo em instantes.') })
    renderRoute('/admin/contatos/j1')

    await user.click(await screen.findByRole('radio', { name: 'Em contato' }))

    expect(await screen.findByText('Algo deu errado do nosso lado. Tente de novo em instantes.')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Nova' })).toBeChecked()
  })

  it('says the message was not found, with the way back', async () => {
    open({ ...listing(), 'GET /admin/contacts/zz': () => apiError(404, 'contact_not_found', 'Não encontramos essa mensagem.') })
    renderRoute('/admin/contatos/zz')

    expect(await screen.findByText('Não encontramos essa mensagem')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para a fila' })).toHaveAttribute('href', '/admin/contatos')
  })
})

describe('the internal note', () => {
  it('shows the note that was already written, and says only the staff sees it', async () => {
    open()
    renderRoute('/admin/contatos/k1')

    const field = await screen.findByLabelText(/Nota interna/)
    expect(field).toHaveValue('ligar na segunda')
    expect(screen.getByText('só a equipe vê')).toBeInTheDocument()
    expect(field).toHaveAttribute('placeholder', 'Ex.: liguei, volta a falar dia 15')
    expect(field).toHaveAttribute('maxlength', '2000')
  })

  it('saves when the field loses focus, sending only the note, and says it was kept', async () => {
    const user = userEvent.setup()
    open({ ...listing(), 'PATCH /admin/contacts/j1': () => ({ status: 200, data: { contact: { ...JULIANA, staffNote: 'liguei, volta dia 15' } } }) })
    renderRoute('/admin/contatos/j1')

    await user.type(await screen.findByLabelText(/Nota interna/), 'liguei, volta dia 15')
    expect(calls('PATCH /admin/contacts/j1')).toHaveLength(0)
    await user.tab()

    await waitFor(() => expect(calls('PATCH /admin/contacts/j1')).toHaveLength(1))
    expect(calls('PATCH /admin/contacts/j1')[0]!.body).toEqual({ staffNote: 'liguei, volta dia 15' })
    expect(await screen.findByText('Nota guardada.')).toBeInTheDocument()
  })

  it('does not call the API when the field loses focus without a change', async () => {
    const user = userEvent.setup()
    open()
    renderRoute('/admin/contatos/k1')

    await user.click(await screen.findByLabelText(/Nota interna/))
    await user.tab()

    expect(calls('PATCH /admin/contacts/k1')).toHaveLength(0)
  })

  it('sends an empty text to clear the note', async () => {
    const user = userEvent.setup()
    open({ ...listing(), 'PATCH /admin/contacts/k1': () => ({ status: 200, data: { contact: { ...COLEGIO, staffNote: null } } }) })
    renderRoute('/admin/contatos/k1')

    await user.clear(await screen.findByLabelText(/Nota interna/))
    await user.tab()

    await waitFor(() => expect(calls('PATCH /admin/contacts/k1')).toHaveLength(1))
    expect(calls('PATCH /admin/contacts/k1')[0]!.body).toEqual({ staffNote: '' })
  })

  it('says it was not kept, and keeps the text in the field, when the server refuses', async () => {
    const user = userEvent.setup()
    open({ ...listing(), 'PATCH /admin/contacts/j1': () => apiError(500, 'internal_error', 'Algo deu errado do nosso lado. Tente de novo em instantes.') })
    renderRoute('/admin/contatos/j1')

    const field = await screen.findByLabelText(/Nota interna/)
    await user.type(field, 'importante')
    await user.tab()

    expect(await screen.findByText(/A nota não foi guardada/)).toBeInTheDocument()
    expect(field).toHaveValue('importante')
  })

  it('still sends the status when the main button is tapped right after typing the note: the note saving does not disable it', async () => {
    const user = userEvent.setup()
    open({
      ...listing(),
      'PATCH /admin/contacts/j1': (request) => ({ status: 200, data: { contact: { ...JULIANA, ...(request.body as object) } } }),
    })
    renderRoute('/admin/contatos/j1')

    await user.type(await screen.findByLabelText(/Nota interna/), 'liguei')
    await user.click(screen.getByRole('button', { name: 'Marcar "em contato"' }))

    await waitFor(() => expect(calls('PATCH /admin/contacts/j1')).toHaveLength(2))
    expect(calls('PATCH /admin/contacts/j1').map((request) => request.body)).toEqual([{ staffNote: 'liguei' }, { status: 'in_contact' }])
  })

  it('does not save the status chooser and the note in one request: each goes alone', async () => {
    const user = userEvent.setup()
    open({ ...listing(), 'PATCH /admin/contacts/j1': (request) => ({ status: 200, data: { contact: { ...JULIANA, ...(request.body as object) } } }) })
    renderRoute('/admin/contatos/j1')

    fireEvent.change(await screen.findByLabelText(/Nota interna/), { target: { value: 'rascunho' } })
    await user.click(screen.getByRole('radio', { name: 'Em contato' }))

    await waitFor(() => expect(calls('PATCH /admin/contacts/j1').length).toBeGreaterThan(0))
    for (const request of calls('PATCH /admin/contacts/j1')) {
      expect(Object.keys(request.body as object)).toHaveLength(1)
    }
  })
})

describe('the queue on the desktop (design 10l)', () => {
  it('shows the list and the first message side by side, with the first one chosen', async () => {
    open(listing(), { desktop: true })
    renderRoute('/admin/contatos')

    const rows = within(await screen.findByRole('list', { name: 'Mensagens' })).getAllByRole('listitem')
    expect(within(rows[0]!).getByRole('link')).toHaveAttribute('aria-current', 'true')
    expect(await screen.findByRole('heading', { name: 'Juliana Alves', level: 2 })).toBeInTheDocument()
  })

  it('shows the message of the address, marking its row', async () => {
    open(listing(), { desktop: true })
    renderRoute('/admin/contatos/c1')

    expect(await screen.findByRole('heading', { name: 'EMEF Jardim São Bento', level: 2 })).toBeInTheDocument()
    const rows = within(await screen.findByRole('list', { name: 'Mensagens' })).getAllByRole('listitem')
    expect(within(rows[1]!).getByRole('link')).toHaveAttribute('aria-current', 'true')
    expect(within(rows[0]!).getByRole('link')).not.toHaveAttribute('aria-current')
  })

  it('says "Responder por e-mail" and "Marcar em contato" in the panel', async () => {
    open(listing(), { desktop: true })
    renderRoute('/admin/contatos/c1')

    expect(await screen.findByRole('button', { name: 'Marcar "em contato"' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Responder por e-mail/ })).toHaveAttribute('href', 'mailto:regina@exemplo.com')
  })
})

describe('the export', () => {
  it('downloads the spreadsheet of what is on screen, with the same situation and no page', async () => {
    const user = userEvent.setup()
    open({ ...listing(), 'GET /admin/contacts/export.csv': () => ({ status: 200, data: new Blob(['x']) }) })
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() }))
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    renderRoute('/admin/contatos?status=new&pagina=2')

    await user.click(await screen.findByRole('button', { name: 'Exportar CSV' }))

    await waitFor(() => expect(click).toHaveBeenCalledOnce())
    expect(calls('GET /admin/contacts/export.csv')[0]!.params).toEqual({ status: 'new' })
    click.mockRestore()
  })

  it('says it could not download', async () => {
    const user = userEvent.setup()
    open({ ...listing(), 'GET /admin/contacts/export.csv': () => 'network-error' })
    renderRoute('/admin/contatos')

    await user.click(await screen.findByRole('button', { name: 'Exportar CSV' }))

    expect(await screen.findByText('Não foi possível baixar a planilha agora. Tente de novo.')).toBeInTheDocument()
  })
})

describe('the menu of the panel', () => {
  it('has "Mensagens" under "Pessoas", before "Voluntários", with the number of new ones, and marks the current screen', async () => {
    open({ ...listing(), 'GET /admin/volunteer-applications/counts': () => ({ status: 200, data: { counts: { all: 0, new: 0, in_contact: 0, volunteering: 0, ended: 0 } } }) }, { desktop: true })
    renderRoute('/admin/contatos/c1')

    const side = within(await screen.findByRole('navigation', { name: 'Seções do painel' }))
    const link = side.getByRole('link', { name: /Mensagens/ })
    expect(link).toHaveAttribute('href', '/admin/contatos')
    expect(link).toHaveAttribute('aria-current', 'page')
    expect(await within(link).findByText('novas', { exact: false })).toBeInTheDocument()
    expect(link).toHaveTextContent('2')
    const people = within(side.getByRole('region', { name: 'Pessoas' })).getAllByRole('link')
    expect(people.map((entryLink) => entryLink.getAttribute('href'))).toEqual(['/admin/contatos', '/admin/voluntarios'])
    expect(side.queryByRole('link', { name: 'Contatos' })).not.toBeInTheDocument()
  })

  it('shows no badge when nothing is new, and not a zero', async () => {
    open({ ...listing(), 'GET /admin/contacts/counts': () => ({ status: 200, data: { counts: { ...COUNTS, new: 0 } } }) })
    renderRoute('/admin/contatos')

    const side = within(await screen.findByRole('navigation', { name: 'Seções do painel' }))
    await waitFor(() => expect(calls('GET /admin/contacts/counts').length).toBeGreaterThan(0))
    expect(side.getByRole('link', { name: 'Mensagens' })).toHaveTextContent(/^Mensagens$/)
  })

  it('has the entry in the "Mais" sheet of the phone too, and counts the screen as one of its own', async () => {
    const user = userEvent.setup()
    open()
    renderRoute('/admin')
    await user.click(within(await screen.findByRole('navigation', { name: 'Atalhos do painel' })).getByRole('button', { name: 'Mais' }))

    const menu = within(screen.getByRole('dialog', { name: 'Painel' }))
    expect(menu.getByRole('link', { name: /Mensagens/, hidden: true })).toHaveAttribute('href', '/admin/contatos')
  })
})

describe('the helpers', () => {
  it('reads the page of the address, and falls back to the first on anything that is not a whole number from 1', () => {
    expect(parsePage('3')).toBe(3)
    expect([null, '', 'x', '0', '-1', '2.5'].map(parsePage)).toEqual([1, 1, 1, 1, 1, 1])
  })

  it('writes the date as the staff reads a queue', () => {
    const now = new Date('2026-10-12T15:00:00Z')
    expect(queueDate('2026-10-12T10:00:00Z', now)).toBe('hoje')
    expect(queueDate('2026-10-11T10:00:00Z', now)).toBe('ontem')
    expect(queueDate('2026-10-09T10:00:00Z', now)).toBe('há 3 dias')
    expect(queueDate('2026-10-02T10:00:00Z', now)).toBe('2 out')
  })
})
