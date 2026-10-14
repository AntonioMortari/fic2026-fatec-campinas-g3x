import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { longDate, numericDate } from '../lib/news'
import type { NewsDetail, NewsItem } from '../types/news'
import { apiError, mockApi } from './auth-support'
import { renderRoute } from './render'

let mock: ReturnType<typeof mockApi>
afterEach(() => mock?.restore())

const ID = '5d79bd06-1fe9-4b77-8111-bfeacda5ee0d'

const item = (overrides: Partial<NewsItem> = {}): NewsItem => ({
  id: ID,
  kind: 'news',
  title: 'Novembro é Mês da Consciência Negra no Ateliê',
  excerpt: 'Contações, oficinas e uma roda de conversa ao longo do mês.',
  publishedAt: '2026-10-11T15:00:00.000Z',
  image: null,
  ...overrides,
})

const detail = (overrides: Partial<NewsDetail> = {}): NewsDetail => ({
  id: ID,
  kind: 'news',
  title: 'Novembro é Mês da Consciência Negra no Ateliê',
  summary: 'Contações, oficinas e uma roda de conversa ao longo do mês.',
  paragraphs: ['Primeiro parágrafo.', 'Segundo parágrafo.'],
  publishedAt: '2026-10-11T15:00:00.000Z',
  image: null,
  ...overrides,
})

const open = (handlers: Parameters<typeof mockApi>[0]) => {
  localStorage.removeItem('af-session')
  mock = mockApi(handlers)
}

describe('the dates of the news', () => {
  it('are read in São Paulo, not in the zone of the device', () => {
    expect(longDate('2026-10-11T02:30:00.000Z')).toBe('10 de outubro de 2026')
    expect(longDate('2026-10-11T03:00:00.000Z')).toBe('11 de outubro de 2026')
    expect(numericDate('2026-10-11T02:59:59.000Z')).toBe('10/10/2026')
  })
})

describe('the news list (design 11e and 11g)', () => {
  it('lists each piece with its kind, date, title linked to its page, excerpt and "Saber mais"', async () => {
    open({
      'GET /news': () => ({
        status: 200,
        data: {
          data: [
            item({ image: { url: '/api/news/x/image?v=1', alt: 'Pilha de livros infantis.' } }),
            item({ id: 'b', kind: 'campaign', title: 'Campanha: livros', publishedAt: '2026-09-22T12:00:00.000Z' }),
          ],
        },
      }),
    })
    renderRoute('/noticias')

    expect(await screen.findByRole('heading', { level: 1, name: 'Notícias' })).toBeInTheDocument()
    expect(screen.getByText('O que anda acontecendo no ateliê.')).toBeInTheDocument()
    const rows = within(await screen.findByRole('list', { name: 'Notícias' })).getAllByRole('listitem')
    expect(rows).toHaveLength(2)

    expect(within(rows[0]!).getByText('Notícia')).toBeInTheDocument()
    expect(within(rows[0]!).getByText('11 de outubro de 2026')).toBeInTheDocument()
    expect(within(rows[0]!).getByRole('link', { name: 'Novembro é Mês da Consciência Negra no Ateliê' })).toHaveAttribute('href', `/noticias/${ID}`)
    expect(within(rows[0]!).getByText('Contações, oficinas e uma roda de conversa ao longo do mês.')).toBeInTheDocument()
    expect(within(rows[0]!).getByRole('link', { name: /^Saber mais/ })).toHaveAttribute('href', `/noticias/${ID}`)
    expect(within(rows[0]!).getByRole('img', { name: 'Pilha de livros infantis.' })).toHaveAttribute('src', '/api/news/x/image?v=1')

    expect(within(rows[1]!).getByText('Campanha')).toBeInTheDocument()
    expect(within(rows[1]!).queryByRole('img')).not.toBeInTheDocument()
  })

  it('gives the empty state of the design, with the Instagram and the WhatsApp as links', async () => {
    open({ 'GET /news': () => ({ status: 200, data: { data: [] } }) })
    renderRoute('/noticias')

    const message = await screen.findByText(/Ainda não publicamos nenhuma notícia por aqui/)
    expect(message).toHaveTextContent('Siga a gente no Instagram ou fale pelo WhatsApp para saber das novidades enquanto esta página ganha as primeiras publicações.')
    expect(within(message).getByRole('link', { name: 'Instagram' })).toHaveAttribute('href', expect.stringContaining('instagram.com'))
    expect(within(message).getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', expect.stringContaining('wa.me'))
    expect(screen.queryByRole('list', { name: 'Notícias' })).not.toBeInTheDocument()
  })

  it('says it is loading, and says when it could not load, and tries again', async () => {
    const user = userEvent.setup()
    let attempt = 0
    open({
      'GET /news': () => {
        attempt += 1
        return attempt === 1 ? 'network-error' : { status: 200, data: { data: [item()] } }
      },
    })
    renderRoute('/noticias')

    expect(await screen.findByText('Não conseguimos carregar as notícias agora')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByRole('list', { name: 'Notícias' })).toBeInTheDocument()
  })

  it('keeps the follow-us card for the desktop, with the same two channels as the empty state', async () => {
    open({ 'GET /news': () => ({ status: 200, data: { data: [item()] } }) })
    renderRoute('/noticias')

    const card = await screen.findByRole('complementary', { name: 'Acompanhe também', hidden: true })
    expect(card).toHaveTextContent('O dia a dia sai antes no Instagram.')
    expect(within(card).getByRole('link', { name: '@atelie_afrocultural', hidden: true })).toBeInTheDocument()
    expect(within(card).getByRole('link', { name: 'WhatsApp (11) 95396-8344', hidden: true })).toBeInTheDocument()
  })
})

describe('a piece of news (design 11f)', () => {
  it('shows kind and date, title, summary, image and the text in paragraphs, in that order', async () => {
    open({ [`GET /news/${ID}`]: () => ({ status: 200, data: { news: detail({ kind: 'campaign', image: { url: '/api/news/x/image?v=1', alt: 'Crianças em roda.' } }) } }) })
    renderRoute(`/noticias/${ID}`)

    const title = await screen.findByRole('heading', { level: 1, name: 'Novembro é Mês da Consciência Negra no Ateliê' })
    const article = title.closest('article')!
    expect(within(article).getByText('Campanha')).toBeInTheDocument()
    expect(within(article).getByText('11 de outubro de 2026')).toBeInTheDocument()
    const order = [title, within(article).getByText('Contações, oficinas e uma roda de conversa ao longo do mês.'), within(article).getByRole('img', { name: 'Crianças em roda.' }), within(article).getByText('Primeiro parágrafo.'), within(article).getByText('Segundo parágrafo.')]
    for (let index = 1; index < order.length; index += 1) {
      expect(order[index - 1]!.compareDocumentPosition(order[index]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }
    expect(screen.getAllByRole('link', { name: /Notícias/ }).some((link) => link.getAttribute('href') === '/noticias')).toBe(true)
    expect(within(article).getByRole('link', { name: 'Ver todas as notícias' })).toHaveAttribute('href', '/noticias')
  })

  it('leaves out the summary and the image when the piece has none', async () => {
    open({ [`GET /news/${ID}`]: () => ({ status: 200, data: { news: detail({ summary: null }) } }) })
    renderRoute(`/noticias/${ID}`)

    const title = await screen.findByRole('heading', { level: 1 })
    expect(within(title.closest('article')!).queryByRole('img')).not.toBeInTheDocument()
    expect(within(title.closest('article')!).getAllByText(/parágrafo/)).toHaveLength(2)
  })

  it('shares the address with the share sheet of the device when there is one', async () => {
    const user = userEvent.setup()
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, share })
    open({ [`GET /news/${ID}`]: () => ({ status: 200, data: { news: detail() } }) })
    renderRoute(`/noticias/${ID}`)

    await user.click(await screen.findByRole('button', { name: /^Compartilhar/ }))

    expect(share).toHaveBeenCalledWith({ title: 'Novembro é Mês da Consciência Negra no Ateliê', url: expect.stringContaining(`/noticias/${ID}`) })
    vi.unstubAllGlobals()
  })

  it('answers the 404 page for a draft or a piece that does not exist', async () => {
    open({ [`GET /news/${ID}`]: () => apiError(404, 'news_not_found', 'Não encontramos essa notícia.') })
    renderRoute(`/noticias/${ID}`)

    expect(await screen.findByText(/Página não encontrada/)).toBeInTheDocument()
  })

  it('says the connection failed, rather than 404, when the API is out', async () => {
    open({ [`GET /news/${ID}`]: () => 'network-error' })
    renderRoute(`/noticias/${ID}`)

    expect(await screen.findByText('Não conseguimos carregar a notícia')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText(/Página não encontrada/)).not.toBeInTheDocument())
  })
})
