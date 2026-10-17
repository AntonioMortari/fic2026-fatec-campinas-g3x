import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiError, fakeUser, mockApi } from './auth-support'
import { ADMIN_FAQ, faqItem } from './faq-support'
import { renderRoute } from './render'

type Handlers = Parameters<typeof mockApi>[0]

let mock: ReturnType<typeof mockApi>
afterEach(() => {
  mock?.restore()
  vi.unstubAllGlobals()
})

const STAFF = { ...fakeUser, isStaff: true }

function open(handlers: Handlers = {}, { desktop = false, account = STAFF }: { desktop?: boolean; account?: typeof fakeUser } = {}) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: desktop && query.includes('64rem'),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }))
  localStorage.setItem('af-session', '1')
  mock = mockApi({
    'POST /auth/refresh': () => ({ status: 200, data: { token: 'a.b.c', user: account } }),
    'GET /admin/faq': () => ({ status: 200, data: ADMIN_FAQ }),
    ...handlers,
  })
}

const calls = (key: string) => mock.requests.filter((request) => `${request.method} ${request.url}` === key)

describe('the questions screens are for staff only', () => {
  it.each(['/admin/perguntas', '/admin/perguntas/nova', '/admin/perguntas/temas', '/admin/perguntas/imagem/editar'])('answers the 404 of the public site on %s and asks the API for nothing', async (path) => {
    open({}, { account: fakeUser })
    renderRoute(path)

    expect(await screen.findByText(/Página não encontrada/)).toBeInTheDocument()
    expect(mock.requests.filter((request) => request.url.startsWith('/admin/faq'))).toHaveLength(0)
  })
})

describe('the list of questions of the panel (designs 18d and 18e)', () => {
  it('draws the title, the count of what is on air and the two actions, with "Nova pergunta" as a link', async () => {
    open()
    renderRoute('/admin/perguntas')

    expect(await screen.findByRole('heading', { level: 1, name: 'Perguntas frequentes' })).toBeInTheDocument()
    expect(await screen.findByText('2 no ar · 1 fora do ar · ordem por tema')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Nova pergunta' })).toHaveAttribute('href', '/admin/perguntas/nova')
    expect(screen.getByRole('link', { name: 'Temas' })).toHaveAttribute('href', '/admin/perguntas/temas')
    expect(screen.getByText(/Não dá para apagar uma pergunta nem um tema, de propósito/)).toBeInTheDocument()
  })

  it('groups the questions by theme, each with its state in words and the page its text comes from', async () => {
    open()
    renderRoute('/admin/perguntas')

    const participar = within(await screen.findByRole('region', { name: 'Participar das atividades' }))
    const rows = participar.getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('Preciso autorizar o uso da minha imagem')
    expect(rows[0]).toHaveTextContent('Texto de: Formulário de inscrição')
    expect(rows[0]).toHaveTextContent('No ar')
    expect(rows[1]).toHaveTextContent('Fora do ar')
    expect(within(rows[0]!).getByRole('link', { name: /Preciso autorizar/ })).toHaveAttribute('href', '/admin/perguntas/imagem/editar')
    expect(within(screen.getByRole('region', { name: 'Para escolas' })).getAllByRole('listitem')).toHaveLength(1)
  })

  it('says a theme is down on its heading', async () => {
    open({ 'GET /admin/faq': () => ({ status: 200, data: { ...ADMIN_FAQ, themes: [{ ...ADMIN_FAQ.themes[0]!, published: false }, ADMIN_FAQ.themes[1]!] } }) })
    renderRoute('/admin/perguntas')

    expect(await screen.findByText(/· tema fora do ar/)).toBeInTheDocument()
    expect(screen.getByText(/· tema fora do ar/).closest('h2')).toHaveTextContent('Participar das atividades')
  })

  it('has no way to erase anything', async () => {
    open()
    renderRoute('/admin/perguntas')

    await screen.findByRole('region', { name: 'Para escolas' })
    expect(screen.queryByRole('button', { name: /apagar|excluir|remover/i })).not.toBeInTheDocument()
  })

  it('moves a question down and up inside its theme, and the arrows at the ends are off', async () => {
    const user = userEvent.setup()
    open({ 'PATCH /admin/faq/items/imagem/position': () => ({ status: 200, data: { item: faqItem({ sortOrder: 2 }) } }) })
    renderRoute('/admin/perguntas')
    await screen.findByRole('region', { name: 'Participar das atividades' })

    expect(screen.getByRole('button', { name: /^Subir: Preciso autorizar/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^Descer: Quem tem menos/ })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /^Descer: Preciso autorizar/ }))

    await waitFor(() => expect(calls('PATCH /admin/faq/items/imagem/position')).toHaveLength(1))
    expect(calls('PATCH /admin/faq/items/imagem/position')[0]!.body).toEqual({ direction: 'down' })
  })

  it('says when the load failed and tries again', async () => {
    const user = userEvent.setup()
    let fail = true
    open({ 'GET /admin/faq': () => (fail ? apiError(500, 'internal_error', 'x') : { status: 200, data: ADMIN_FAQ }) })
    renderRoute('/admin/perguntas')

    expect(await screen.findByText('Não conseguimos carregar as perguntas')).toBeInTheDocument()
    fail = false
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByRole('region', { name: 'Para escolas' })).toBeInTheDocument()
  })
})

describe('writing and correcting a question (designs 18d and 18f)', () => {
  it('a new question is announced as out of the air, with the three required fields and a theme list that ends in "+ Novo tema…"', async () => {
    open()
    renderRoute('/admin/perguntas/nova')

    expect(await screen.findByRole('heading', { level: 1, name: 'Nova pergunta' })).toBeInTheDocument()
    expect(screen.getByText('Nova · fica fora do ar até você publicar')).toBeInTheDocument()
    const theme = screen.getByLabelText('Tema')
    expect(within(theme).getAllByRole('option').map((option) => option.textContent)).toEqual(['Escolha um tema', 'Participar das atividades', 'Para escolas', '+ Novo tema…'])
    expect(screen.getByLabelText(/Link no fim/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Onde esta resposta já está escrita no site/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Tirar do ar|Pôr no ar/ })).not.toBeInTheDocument()
  })

  it('does not send until a theme and the page it was copied from are chosen, and says what is missing', async () => {
    const user = userEvent.setup()
    open()
    renderRoute('/admin/perguntas/nova')
    await user.type(await screen.findByLabelText('Pergunta'), 'Tem lanche?')
    await user.type(screen.getByLabelText('Resposta'), 'Não.')

    await user.click(screen.getAllByRole('button', { name: 'Guardar' })[0]!)

    expect(await screen.findByText('Escolha um tema.')).toBeInTheDocument()
    expect(screen.getByText('Diga em que página do site esta resposta já está escrita.')).toBeInTheDocument()
    expect(calls('POST /admin/faq/items')).toHaveLength(0)
  })

  it('saves the question without publishing it and says it stays out of the air until "Pôr no ar"', async () => {
    const user = userEvent.setup()
    open({ 'POST /admin/faq/items': () => ({ status: 201, data: { item: faqItem({ id: 'tem-lanche', question: 'Tem lanche?', published: false }) } }) })
    renderRoute('/admin/perguntas/nova')
    await user.type(await screen.findByLabelText('Pergunta'), 'Tem lanche?')
    await user.type(screen.getByLabelText('Resposta'), 'Não.')
    await user.selectOptions(screen.getByLabelText('Tema'), 'escolas')
    await user.selectOptions(screen.getByLabelText(/Link no fim/), '/agenda')
    await user.selectOptions(screen.getByLabelText(/Onde esta resposta/), 'agenda')

    await user.click(screen.getAllByRole('button', { name: 'Guardar' })[0]!)

    await waitFor(() => expect(calls('POST /admin/faq/items')).toHaveLength(1))
    expect(calls('POST /admin/faq/items')[0]!.body).toEqual({ question: 'Tem lanche?', answer: 'Não.', themeId: 'escolas', linkTo: '/agenda', source: 'agenda' })
    expect(await screen.findByText('Pergunta guardada. Ela está fora do ar até você apertar “Pôr no ar”.')).toBeInTheDocument()
  })

  it('creates the theme first when "+ Novo tema…" is chosen, then saves the question in it', async () => {
    const user = userEvent.setup()
    open({
      'POST /admin/faq/themes': () => ({ status: 201, data: { theme: { id: 'biblioteca', name: 'Biblioteca', published: true, sortOrder: 3 } } }),
      'POST /admin/faq/items': () => ({ status: 201, data: { item: faqItem({ id: 'q', published: false }) } }),
    })
    renderRoute('/admin/perguntas/nova')
    await user.type(await screen.findByLabelText('Pergunta'), 'Tem biblioteca?')
    await user.type(screen.getByLabelText('Resposta'), 'Tem.')
    await user.selectOptions(screen.getByLabelText('Tema'), '__new__')
    await user.type(screen.getByLabelText('Nome do novo tema'), 'Biblioteca')
    await user.selectOptions(screen.getByLabelText(/Onde esta resposta/), 'agenda')

    await user.click(screen.getAllByRole('button', { name: 'Guardar' })[0]!)

    await waitFor(() => expect(calls('POST /admin/faq/items')).toHaveLength(1))
    expect(calls('POST /admin/faq/themes')[0]!.body).toEqual({ name: 'Biblioteca' })
    expect(calls('POST /admin/faq/items')[0]!.body).toMatchObject({ themeId: 'biblioteca' })
  })

  it('shows the message of the server on the field it names, and keeps what was typed', async () => {
    const user = userEvent.setup()
    open({
      'POST /admin/faq/items': () => ({
        status: 400,
        data: { error: { code: 'validation_error', message: 'Dados inválidos.', details: [{ field: 'question', message: 'A pergunta passou de 200 caracteres.' }] } },
      }),
    })
    renderRoute('/admin/perguntas/nova')
    await user.type(await screen.findByLabelText('Pergunta'), 'Tem lanche?')
    await user.type(screen.getByLabelText('Resposta'), 'Não.')
    await user.selectOptions(screen.getByLabelText('Tema'), 'escolas')
    await user.selectOptions(screen.getByLabelText(/Onde esta resposta/), 'agenda')

    await user.click(screen.getAllByRole('button', { name: 'Guardar' })[0]!)

    expect(await screen.findByText('A pergunta passou de 200 caracteres.')).toBeInTheDocument()
    expect(screen.getByLabelText('Pergunta')).toHaveValue('Tem lanche?')
  })

  it('opens an existing question with its values, its state and the gesture that fits it', async () => {
    open()
    renderRoute('/admin/perguntas/menores/editar')

    expect(await screen.findByRole('heading', { level: 1, name: 'Corrigir pergunta' })).toBeInTheDocument()
    expect(screen.getByText('Fora do ar · Participar das atividades')).toBeInTheDocument()
    expect(screen.getByLabelText('Pergunta')).toHaveValue('Quem tem menos de 18 anos pode se inscrever?')
    expect(screen.getByLabelText('Tema')).toHaveValue('participar')
    expect(screen.getAllByRole('button', { name: 'Pôr no ar' }).length).toBeGreaterThan(0)
  })

  it('puts it on the air and says it already shows on the public page', async () => {
    const user = userEvent.setup()
    open({ 'PATCH /admin/faq/items/menores/publication': () => ({ status: 200, data: { item: faqItem({ id: 'menores', published: true }) } }) })
    renderRoute('/admin/perguntas/menores/editar')
    await screen.findByRole('heading', { name: 'Corrigir pergunta' })

    await user.click(screen.getAllByRole('button', { name: 'Pôr no ar' })[0]!)

    await waitFor(() => expect(calls('PATCH /admin/faq/items/menores/publication')[0]?.body).toEqual({ published: true }))
    expect(await screen.findByText('No ar. A pergunta já aparece na página pública.')).toBeInTheDocument()
  })

  it('takes it down in one touch, with no dialog, because it comes back with one touch', async () => {
    const user = userEvent.setup()
    open({ 'PATCH /admin/faq/items/imagem/publication': () => ({ status: 200, data: { item: faqItem({ published: false }) } }) })
    renderRoute('/admin/perguntas/imagem/editar')
    await screen.findByRole('heading', { name: 'Corrigir pergunta' })

    await user.click(screen.getAllByRole('button', { name: 'Tirar do ar' })[0]!)

    await waitFor(() => expect(calls('PATCH /admin/faq/items/imagem/publication')[0]?.body).toEqual({ published: false }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await screen.findByText('Tirada do ar. Ela continua guardada aqui e volta com um toque.')).toBeInTheDocument()
  })

  it('an address that does not exist is the 404', async () => {
    open()
    renderRoute('/admin/perguntas/nao-existe/editar')

    expect(await screen.findByText(/Página não encontrada/)).toBeInTheDocument()
  })

  it('on the desktop the first question is already open on the right, and the list stays on the left', async () => {
    open({}, { desktop: true })
    renderRoute('/admin/perguntas')

    expect(await screen.findByRole('heading', { level: 1, name: 'Corrigir pergunta' })).toBeInTheDocument()
    expect(screen.getByLabelText('Pergunta')).toHaveValue('Preciso autorizar o uso da minha imagem para participar?')
    expect(screen.getByRole('heading', { level: 1, name: 'Perguntas frequentes' })).toBeInTheDocument()
  })
})

describe('the themes (design 18d, "Temas")', () => {
  it('lists the themes in order with how many questions each has, and the explanation of what taking one down does', async () => {
    open({}, { desktop: true })
    renderRoute('/admin/perguntas/temas')

    const list = within(await screen.findByRole('list', { name: 'Temas' }))
    const rows = list.getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('Participar das atividades')
    expect(rows[0]).toHaveTextContent('2 perguntas')
    expect(rows[1]).toHaveTextContent('Para escolas')
    expect(rows[1]).toHaveTextContent('1 pergunta')
    expect(screen.getByText(/Tirar um tema do ar esconde todas as perguntas dele no site/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Fechar' })).toHaveAttribute('href', '/admin/perguntas')
  })

  it('creates a theme and warns that it only shows with a question on the air', async () => {
    const user = userEvent.setup()
    open({ 'POST /admin/faq/themes': () => ({ status: 201, data: { theme: { id: 'biblioteca', name: 'Biblioteca digital', published: true, sortOrder: 3 } } }) }, { desktop: true })
    renderRoute('/admin/perguntas/temas')
    await user.type(await screen.findByLabelText('Novo tema'), 'Biblioteca digital')

    await user.click(screen.getByRole('button', { name: 'Adicionar' }))

    await waitFor(() => expect(calls('POST /admin/faq/themes')[0]?.body).toEqual({ name: 'Biblioteca digital' }))
    expect(await screen.findByText('Tema criado. Ele só aparece na página pública quando tiver uma pergunta no ar.')).toBeInTheDocument()
  })

  it('shows the message of the server when the name already exists', async () => {
    const user = userEvent.setup()
    open({ 'POST /admin/faq/themes': () => apiError(409, 'theme_name_taken', 'Já existe um tema com esse nome.') }, { desktop: true })
    renderRoute('/admin/perguntas/temas')
    await user.type(await screen.findByLabelText('Novo tema'), 'para escolas')

    await user.click(screen.getByRole('button', { name: 'Adicionar' }))

    expect(await screen.findByText('Já existe um tema com esse nome.')).toBeInTheDocument()
  })

  it('renames a theme', async () => {
    const user = userEvent.setup()
    open({ 'PUT /admin/faq/themes/escolas': () => ({ status: 200, data: { theme: { ...ADMIN_FAQ.themes[1]!, name: 'Escolas e instituições' } } }) }, { desktop: true })
    renderRoute('/admin/perguntas/temas')
    await user.click(await screen.findByRole('button', { name: /^Renomear Para escolas/ }))
    const field = screen.getByLabelText('Nome do tema')
    await user.clear(field)
    await user.type(field, 'Escolas e instituições')

    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(calls('PUT /admin/faq/themes/escolas')[0]?.body).toEqual({ name: 'Escolas e instituições' }))
    expect(await screen.findByText('Tema renomeado. O novo nome já vale na página pública.')).toBeInTheDocument()
  })

  it('takes a theme down and says how many questions left the site and stay stored', async () => {
    const user = userEvent.setup()
    open({ 'PATCH /admin/faq/themes/participar/publication': () => ({ status: 200, data: { theme: { ...ADMIN_FAQ.themes[0]!, published: false } } }) }, { desktop: true })
    renderRoute('/admin/perguntas/temas')

    await user.click(await screen.findByRole('button', { name: /^Tirar do ar Participar das atividades/ }))

    await waitFor(() => expect(calls('PATCH /admin/faq/themes/participar/publication')[0]?.body).toEqual({ published: false }))
    expect(await screen.findByText('Tema tirado do ar. As 2 perguntas dele saíram do site e continuam guardadas aqui.')).toBeInTheDocument()
  })

  it('moves a theme, and the arrows at the ends are off', async () => {
    const user = userEvent.setup()
    open({ 'PATCH /admin/faq/themes/escolas/position': () => ({ status: 200, data: { theme: { ...ADMIN_FAQ.themes[1]!, sortOrder: 1 } } }) }, { desktop: true })
    renderRoute('/admin/perguntas/temas')

    expect(await screen.findByRole('button', { name: 'Subir o tema Participar das atividades' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Descer o tema Para escolas' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Subir o tema Para escolas' }))

    await waitFor(() => expect(calls('PATCH /admin/faq/themes/escolas/position')[0]?.body).toEqual({ direction: 'up' }))
  })
})

describe('the menu of the panel', () => {
  it('has "Perguntas frequentes" under "Conteúdo", and nothing else new', async () => {
    open({}, { desktop: true })
    renderRoute('/admin')

    expect(await screen.findByRole('link', { name: 'Perguntas frequentes' })).toHaveAttribute('href', '/admin/perguntas')
  })
})
