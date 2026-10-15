import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AdminNews } from '../types/admin-news'
import { apiError, fakeUser, mockApi } from './auth-support'
import { renderRoute } from './render'

type Handlers = Parameters<typeof mockApi>[0]

let mock: ReturnType<typeof mockApi>
afterEach(() => {
  mock?.restore()
  vi.unstubAllGlobals()
})

const STAFF = { ...fakeUser, isStaff: true }

const news = (overrides: Partial<AdminNews> = {}): AdminNews => ({
  id: 'n1',
  kind: 'news',
  title: 'Novembro é Mês da Consciência Negra no Ateliê',
  summary: 'Contações e oficinas.',
  body: 'Primeiro parágrafo.\n\nSegundo parágrafo.',
  published: false,
  publishedAt: null,
  createdAt: '2026-10-10T12:00:00.000Z',
  updatedAt: '2026-10-10T12:00:00.000Z',
  image: null,
  ...overrides,
})

const DRAFT = news()
const LIVE = news({ id: 'n2', kind: 'campaign', title: 'Campanha: livros', summary: null, published: true, publishedAt: '2026-10-11T15:00:00.000Z', image: { url: '/api/admin/news/n2/image?v=1', alt: 'Pilha de livros.' } })

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
    'GET /admin/news': () => ({ status: 200, data: { data: [DRAFT, LIVE] } }),
    'GET /admin/news/n2/image': () => ({ status: 200, data: new Blob(['x'], { type: 'image/png' }) }),
    ...handlers,
  })
}

const calls = (key: string) => mock.requests.filter((request) => `${request.method} ${request.url}` === key)

describe('the news screens are for staff only', () => {
  it.each(['/admin/noticias', '/admin/noticias/nova', '/admin/noticias/n1/editar'])('answers the 404 of the public site on %s and asks the API for nothing', async (path) => {
    open({}, { account: fakeUser })
    renderRoute(path)

    expect(await screen.findByText(/Página não encontrada/)).toBeInTheDocument()
    expect(mock.requests.filter((request) => request.url.startsWith('/admin/news'))).toHaveLength(0)
  })
})

describe('the list of news of the panel (design 11n)', () => {
  it('draws title, the lead and "Escrever notícia", with the explanation behind a fold', async () => {
    open()
    renderRoute('/admin/noticias')

    expect(await screen.findByRole('heading', { level: 1, name: 'Notícias' })).toBeInTheDocument()
    expect(screen.getByText('Aqui você escreve o que aparece na página de notícias do site.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Escrever notícia' })).toHaveAttribute('href', '/admin/noticias/nova')
    expect(screen.getByText('Como funciona esta tela')).toBeInTheDocument()
    expect(screen.getByText(/Não dá para apagar uma notícia por aqui, de propósito/)).toBeInTheDocument()
  })

  it('shows every piece, draft or live, with its state, kind, the date it was written and the two gestures', async () => {
    open()
    renderRoute('/admin/noticias')

    const rows = within(await screen.findByRole('list', { name: 'Notícias' })).getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('Rascunho')
    expect(rows[0]).toHaveTextContent('Notícia')
    expect(rows[0]).toHaveTextContent('Escrita em 10/10/2026')
    expect(rows[0]).toHaveTextContent('sem imagem')
    expect(within(rows[0]!).getByRole('link', { name: /^Editar/ })).toHaveAttribute('href', '/admin/noticias/n1/editar')
    expect(within(rows[0]!).getByRole('button', { name: /^Publicar/ })).toBeInTheDocument()
    expect(rows[1]).toHaveTextContent('No ar')
    expect(rows[1]).toHaveTextContent('Campanha')
    expect(within(rows[1]!).getByRole('button', { name: /^Tirar do ar/ })).toBeInTheDocument()
  })

  it('has no way to erase a piece', async () => {
    open()
    renderRoute('/admin/noticias')

    await screen.findByRole('list', { name: 'Notícias' })
    expect(screen.queryByRole('button', { name: /apagar|excluir|remover/i })).not.toBeInTheDocument()
  })

  it('asks before publishing, and nothing is sent until the answer is yes', async () => {
    const user = userEvent.setup()
    open({ 'PATCH /admin/news/n1/publication': () => ({ status: 200, data: { news: { ...DRAFT, published: true } } }) })
    renderRoute('/admin/noticias')
    await user.click(await screen.findByRole('button', { name: /^Publicar/ }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'Publicar?' })).toBeInTheDocument()
    expect(dialog).toHaveTextContent('vai para a página de notícias e passa a ser vista por qualquer pessoa.')
    expect(calls('PATCH /admin/news/n1/publication')).toHaveLength(0)

    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(calls('PATCH /admin/news/n1/publication')).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: /^Publicar/ }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Publicar' }))

    await waitFor(() => expect(calls('PATCH /admin/news/n1/publication')).toHaveLength(1))
    expect(calls('PATCH /admin/news/n1/publication')[0]!.body).toEqual({ published: true })
    expect(await screen.findByText('Publicada. A notícia já aparece na página de notícias do site.')).toBeInTheDocument()
  })

  it('asks before taking it down, and says the date is kept', async () => {
    const user = userEvent.setup()
    open({ 'PATCH /admin/news/n2/publication': () => ({ status: 200, data: { news: { ...LIVE, published: false } } }) })
    renderRoute('/admin/noticias')
    await user.click(await screen.findByRole('button', { name: /^Tirar do ar/ }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'Tirar do ar?' })).toBeInTheDocument()
    expect(dialog).toHaveTextContent('A data de publicação fica guardada.')

    await user.click(within(dialog).getByRole('button', { name: 'Tirar do ar' }))

    await waitFor(() => expect(calls('PATCH /admin/news/n2/publication')[0]?.body).toEqual({ published: false }))
    expect(await screen.findByText('Tirada do ar. A notícia sumiu do site e continua guardada aqui, com o texto inteiro.')).toBeInTheDocument()
  })

  it('says when the change failed, and keeps the piece where it was', async () => {
    const user = userEvent.setup()
    open({ 'PATCH /admin/news/n1/publication': () => apiError(500, 'internal_error', 'Algo deu errado.') })
    renderRoute('/admin/noticias')
    await user.click(await screen.findByRole('button', { name: /^Publicar/ }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Publicar' }))

    expect(await screen.findByText('Não foi possível mudar agora. Tente de novo.')).toBeInTheDocument()
  })

  it('says nobody wrote yet', async () => {
    open({ 'GET /admin/news': () => ({ status: 200, data: { data: [] } }) })
    renderRoute('/admin/noticias')
    expect(await screen.findByText('Nenhuma notícia ainda')).toBeInTheDocument()
  })

  it('says when the list could not load, and offers to try again', async () => {
    open({ 'GET /admin/news': () => 'network-error' })
    renderRoute('/admin/noticias')

    expect(await screen.findByText('Não conseguimos carregar as notícias')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
  })

  it('shows the editor of the first piece beside the list on the desktop', async () => {
    open({ 'GET /admin/news/n1': () => ({ status: 200, data: { news: DRAFT } }) }, { desktop: true })
    renderRoute('/admin/noticias')

    expect(await screen.findByRole('heading', { name: 'Editar notícia' })).toBeInTheDocument()
    expect(await screen.findByDisplayValue('Novembro é Mês da Consciência Negra no Ateliê')).toBeInTheDocument()
    expect(screen.getByText(/Rascunho · escrita em 10\/10\/2026/)).toBeInTheDocument()
  })
})

describe('writing a piece (design 11o)', () => {
  it('shows an empty form with the type, title, summary, text and the optional image, and a button that says it does not publish', async () => {
    open()
    renderRoute('/admin/noticias/nova')

    expect(await screen.findByRole('heading', { level: 1, name: 'Escrever notícia' })).toBeInTheDocument()
    expect(screen.getByText(/Guardar não coloca no ar/)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Notícia' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Campanha' })).not.toBeChecked()
    expect(screen.getByLabelText('Título')).toHaveValue('')
    expect(screen.getByLabelText(/Resumo/)).toHaveValue('')
    expect(screen.getByLabelText('Texto da notícia')).toHaveValue('')
    expect(screen.getByText('JPG, PNG, GIF ou WebP, até 4 MB.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Guardar rascunho' }).length).toBeGreaterThan(0)
    expect(screen.queryByLabelText('Descrição da imagem')).not.toBeInTheDocument()
  })

  it('saves a draft with the four fields and no word about publication, then goes back to the list', async () => {
    const user = userEvent.setup()
    open({ 'POST /admin/news': () => ({ status: 201, data: { news: { ...DRAFT, id: 'new' } } }) })
    const router = renderRoute('/admin/noticias/nova')
    await user.type(await screen.findByLabelText('Título'), 'Oficina de turbantes volta em dezembro')
    await user.type(screen.getByLabelText('Texto da notícia'), 'As vagas abrem pela Agenda.')
    await user.click(screen.getByRole('radio', { name: 'Campanha' }))
    await user.click(screen.getAllByRole('button', { name: 'Guardar rascunho' })[0]!)

    await waitFor(() => expect(calls('POST /admin/news')).toHaveLength(1))
    expect(calls('POST /admin/news')[0]!.body).toEqual({ kind: 'campaign', title: 'Oficina de turbantes volta em dezembro', summary: '', body: 'As vagas abrem pela Agenda.' })
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/noticias'))
    expect(await screen.findByText('Rascunho guardado. Publique quando estiver pronta.')).toBeInTheDocument()
    expect(mock.requests.some((request) => request.url.endsWith('/publication'))).toBe(false)
  })

  it('keeps what was written and marks the field the server refused', async () => {
    const user = userEvent.setup()
    open({ 'POST /admin/news': () => apiError(400, 'invalid_data', 'Confira os dados.', [{ field: 'title', message: 'Escreva o título.' }]) })
    const router = renderRoute('/admin/noticias/nova')
    await user.type(await screen.findByLabelText('Texto da notícia'), 'Texto sem título.')
    await user.click(screen.getAllByRole('button', { name: 'Guardar rascunho' })[0]!)

    expect(await screen.findByText('Confira os campos destacados abaixo.')).toBeInTheDocument()
    expect(screen.getByLabelText('Título')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Escreva o título.')).toBeInTheDocument()
    expect(screen.getByLabelText('Texto da notícia')).toHaveValue('Texto sem título.')
    expect(router.state.location.pathname).toBe('/admin/noticias/nova')
  })

  it('refuses an image without description or without the declaration of image use, before sending anything', async () => {
    const user = userEvent.setup()
    open()
    renderRoute('/admin/noticias/nova')
    await user.type(await screen.findByLabelText('Título'), 'Com imagem')
    await user.type(screen.getByLabelText('Texto da notícia'), 'Texto.')
    await user.upload(document.querySelector('input[type=file]')!, new File(['x'], 'foto.png', { type: 'image/png' }))
    await user.click(screen.getAllByRole('button', { name: 'Guardar rascunho' })[0]!)

    expect(await screen.findByText('Descreva a imagem para quem não a enxerga.')).toBeInTheDocument()
    expect(screen.getByText('Para subir a imagem, confirme que existe autorização de uso de imagem.')).toBeInTheDocument()
    expect(calls('POST /admin/news')).toHaveLength(0)
  })

  it('takes each image error away as soon as that field is fixed, not only on the next save', async () => {
    const user = userEvent.setup()
    open()
    renderRoute('/admin/noticias/nova')
    await user.type(await screen.findByLabelText('Título'), 'Com imagem')
    await user.type(screen.getByLabelText('Texto da notícia'), 'Texto.')
    await user.upload(document.querySelector('input[type=file]')!, new File(['x'], 'foto.png', { type: 'image/png' }))
    await user.click(screen.getAllByRole('button', { name: 'Guardar rascunho' })[0]!)
    await screen.findByText('Descreva a imagem para quem não a enxerga.')

    await user.type(screen.getByLabelText('Descrição da imagem'), 'Crianças em roda.')
    expect(screen.queryByText('Descreva a imagem para quem não a enxerga.')).not.toBeInTheDocument()
    expect(screen.getByText('Para subir a imagem, confirme que existe autorização de uso de imagem.')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: /autorização de uso de imagem/ }))
    expect(screen.queryByText('Para subir a imagem, confirme que existe autorização de uso de imagem.')).not.toBeInTheDocument()
  })

  it('refuses a file that is not an image', async () => {
    open()
    renderRoute('/admin/noticias/nova')
    const input = (await screen.findByLabelText('Título')).closest('form')!.querySelector('input[type=file]')!

    fireEvent.change(input, { target: { files: [new File(['x'], 'nota.pdf', { type: 'application/pdf' })] } })

    expect(await screen.findByText('Escolha uma foto JPG, PNG, GIF ou WebP.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Descrição da imagem')).not.toBeInTheDocument()
  })

  it('saves the text first and then sends the image with the description and the declaration', async () => {
    const user = userEvent.setup()
    open({
      'POST /admin/news': () => ({ status: 201, data: { news: { ...DRAFT, id: 'new' } } }),
      'PUT /admin/news/new/image': () => ({ status: 200, data: { news: { ...DRAFT, id: 'new' } } }),
    })
    renderRoute('/admin/noticias/nova')
    await user.type(await screen.findByLabelText('Título'), 'Com imagem')
    await user.type(screen.getByLabelText('Texto da notícia'), 'Texto.')
    await user.upload(document.querySelector('input[type=file]')!, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
    await user.type(await screen.findByLabelText('Descrição da imagem'), 'Crianças em roda ouvindo uma história.')
    await user.click(screen.getByRole('checkbox', { name: /autorização de uso de imagem/ }))
    await user.click(screen.getAllByRole('button', { name: 'Guardar rascunho' })[0]!)

    await waitFor(() => expect(calls('PUT /admin/news/new/image')).toHaveLength(1))
    const body = calls('PUT /admin/news/new/image')[0]!.body as { data: string; alt: string; authorized: boolean }
    expect(body).toEqual({ data: btoa('conteudo'), alt: 'Crianças em roda ouvindo uma história.', authorized: true })
    expect(mock.requests.findIndex((request) => request.url === '/admin/news')).toBeLessThan(mock.requests.findIndex((request) => request.url === '/admin/news/new/image'))
  })

  it('when the image is refused after the text was saved, goes to the saved draft and says so', async () => {
    const user = userEvent.setup()
    open({
      'POST /admin/news': () => ({ status: 201, data: { news: { ...DRAFT, id: 'new' } } }),
      'PUT /admin/news/new/image': () => apiError(413, 'image_too_large', 'A imagem passou de 4 MB. Escolha uma menor.'),
      'GET /admin/news/new': () => ({ status: 200, data: { news: { ...DRAFT, id: 'new' } } }),
    })
    const router = renderRoute('/admin/noticias/nova')
    await user.type(await screen.findByLabelText('Título'), 'Com imagem')
    await user.type(screen.getByLabelText('Texto da notícia'), 'Texto.')
    await user.upload(document.querySelector('input[type=file]')!, new File(['x'], 'foto.png', { type: 'image/png' }))
    await user.type(await screen.findByLabelText('Descrição da imagem'), 'Uma descrição.')
    await user.click(screen.getByRole('checkbox', { name: /autorização de uso de imagem/ }))
    await user.click(screen.getAllByRole('button', { name: 'Guardar rascunho' })[0]!)

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/noticias/new/editar'))
    expect(await screen.findByText(/O texto foi guardado como rascunho, mas a imagem não subiu\. A imagem passou de 4 MB/)).toBeInTheDocument()
    expect(calls('POST /admin/news')).toHaveLength(1)
  })
})

describe('editing a piece', () => {
  it('fills the form with what is saved, says the state, and keeps a live piece live', async () => {
    const user = userEvent.setup()
    open({
      'GET /admin/news/n2': () => ({ status: 200, data: { news: LIVE } }),
      'PUT /admin/news/n2': () => ({ status: 200, data: { news: LIVE } }),
    })
    renderRoute('/admin/noticias/n2/editar')

    expect(await screen.findByDisplayValue('Campanha: livros')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Campanha' })).toBeChecked()
    expect(screen.getByText('Já está no ar: a correção aparece no site ao guardar.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Guardar alterações' }).length).toBeGreaterThan(0)
    expect(screen.getByText('Pilha de livros.')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Título'))
    await user.type(screen.getByLabelText('Título'), 'Campanha: livros e revistas')
    await user.click(screen.getAllByRole('button', { name: 'Guardar alterações' })[0]!)

    await waitFor(() => expect(calls('PUT /admin/news/n2')).toHaveLength(1))
    expect(calls('PUT /admin/news/n2')[0]!.body).toMatchObject({ title: 'Campanha: livros e revistas', kind: 'campaign' })
    expect(Object.keys(calls('PUT /admin/news/n2')[0]!.body as object).sort()).toEqual(['body', 'kind', 'summary', 'title'])
    expect(await screen.findByText('Alterações guardadas. A notícia continua no ar.')).toBeInTheDocument()
  })

  it('removes the image only when the person asks and saves', async () => {
    const user = userEvent.setup()
    open({
      'GET /admin/news/n2': () => ({ status: 200, data: { news: LIVE } }),
      'PUT /admin/news/n2': () => ({ status: 200, data: { news: LIVE } }),
      'DELETE /admin/news/n2/image': () => ({ status: 200, data: { news: { ...LIVE, image: null } } }),
    })
    renderRoute('/admin/noticias/n2/editar')
    await screen.findByDisplayValue('Campanha: livros')

    expect(calls('DELETE /admin/news/n2/image')).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Remover imagem' }))
    expect(screen.getByText('A imagem sai da notícia quando você guardar.')).toBeInTheDocument()
    expect(calls('DELETE /admin/news/n2/image')).toHaveLength(0)
    await user.click(screen.getAllByRole('button', { name: 'Guardar alterações' })[0]!)

    await waitFor(() => expect(calls('DELETE /admin/news/n2/image')).toHaveLength(1))
  })

  it('answers the 404 page for a piece that does not exist', async () => {
    open({ 'GET /admin/news/zzz': () => apiError(404, 'news_not_found', 'Não encontramos essa notícia.') })
    renderRoute('/admin/noticias/zzz/editar')

    expect(await screen.findByText(/Página não encontrada/)).toBeInTheDocument()
  })
})
