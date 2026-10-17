import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { filterFaq } from '../lib/faq'
import { DESKTOP_MENU_GROUPS, MENU_GROUPS } from '../lib/navigation'
import { mockApi } from './auth-support'
import { PUBLIC_FAQ } from './faq-support'
import { renderRoute } from './render'

type Handlers = Parameters<typeof mockApi>[0]

let mock: ReturnType<typeof mockApi>
afterEach(() => mock?.restore())

const questionButton = (name: RegExp) => screen.findByRole('button', { name })
const open = (handlers: Handlers = {}) => {
  mock = mockApi({ 'GET /faq': () => ({ status: 200, data: { data: PUBLIC_FAQ } }), ...handlers })
}

describe('the search', () => {
  it('ignores case and accent, and every word must match', () => {
    const ids = (term: string) => filterFaq(PUBLIC_FAQ, term).flatMap((theme) => theme.items.map((item) => item.id))

    expect(ids('IMAGEM')).toEqual(['imagem'])
    expect(ids('voluntario')).toEqual(['voluntario'])
    expect(ids('escola providenciar')).toEqual(['escola-providenciar'])
    expect(ids('escola xyzzy')).toEqual([])
    expect(filterFaq(PUBLIC_FAQ, ' a ')).toHaveLength(PUBLIC_FAQ.length)
  })

  it('drops a theme with nothing left', () => {
    expect(filterFaq(PUBLIC_FAQ, 'voluntario').map((theme) => theme.id)).toEqual(['voluntariado-e-apoio'])
  })
})

describe('the page (design 18)', () => {
  it('opens with the single h1, the search and every theme the API sent, with its questions closed', async () => {
    open()
    renderRoute('/perguntas-frequentes')
    await questionButton(/Preciso criar conta/)

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Perguntas frequentes' })).toBeInTheDocument()
    expect(screen.getByRole('search', { name: 'Buscar nas perguntas' })).toBeInTheDocument()
    const main = within(screen.getByRole('main'))
    expect(main.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([...PUBLIC_FAQ.map((theme) => theme.name), 'Ficou alguma dúvida?'])
    for (const button of main.getAllByRole('button', { expanded: false })) expect(button).toHaveAttribute('aria-controls')
    expect(main.queryAllByRole('button', { expanded: true })).toHaveLength(0)
  })

  it('opens and closes an answer on click, and the link at the end goes to its page', async () => {
    const user = userEvent.setup()
    open()
    renderRoute('/perguntas-frequentes')
    const button = await questionButton(/Preciso criar conta/)

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/basta preencher o formulário do evento/)).toBeVisible()
    expect(within(screen.getByRole('main')).getByRole('link', { name: /^Agenda/ })).toHaveAttribute('href', '/agenda')

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('grows the answer in height and turns the + into an ×, and keeps the closed answer out of reach', async () => {
    const user = userEvent.setup()
    open()
    renderRoute('/perguntas-frequentes')
    const button = await questionButton(/Preciso criar conta/)
    const panel = document.getElementById(button.getAttribute('aria-controls')!)!
    const sign = button.querySelector('[aria-hidden="true"]')!

    expect(panel).toHaveAttribute('inert')
    expect(panel).toHaveAttribute('data-open', 'false')
    expect(panel.className).toContain('grid-rows-[0fr]')
    expect(panel.className).toContain('transition-[grid-template-rows]')
    expect(sign.className).not.toContain('rotate-45')
    expect(sign.className).toContain('transition-[rotate,background-color]')

    await user.click(button)

    expect(panel).not.toHaveAttribute('inert')
    expect(panel).toHaveAttribute('data-open', 'true')
    expect(panel.className).toContain('data-[open=true]:grid-rows-[1fr]')
    expect(sign.className).toContain('rotate-45')
    expect(sign).toHaveTextContent('+')
  })

  it('arrives with the question of the address already open, and it can still be closed', async () => {
    const user = userEvent.setup()
    open()
    renderRoute('/perguntas-frequentes#imagem')
    const button = await questionButton(/Preciso autorizar o uso da minha imagem/)

    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(await questionButton(/Quem tem menos de 18 anos/)).toHaveAttribute('aria-expanded', 'false')

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('filters while typing, opens what it finds, says how many and goes back with "ver todas"', async () => {
    const user = userEvent.setup()
    open()
    renderRoute('/perguntas-frequentes')
    await questionButton(/Preciso criar conta/)

    await user.type(screen.getByRole('searchbox'), 'escola')

    const main = within(screen.getByRole('main'))
    expect(main.getByRole('status')).toHaveTextContent('2 perguntas encontradas')
    expect(main.getAllByRole('button', { expanded: true })).toHaveLength(2)
    expect(main.queryByRole('button', { name: /Preciso criar conta/ })).not.toBeInTheDocument()

    await user.click(within(main.getByRole('status')).getByRole('button', { name: 'ver todas' }))
    expect(main.queryByRole('status')).not.toBeInTheDocument()
    expect(main.getAllByRole('button', { name: /\?/ }).length).toBe(6)
  })

  it('with no result, offers WhatsApp and the form instead of an empty page', async () => {
    const user = userEvent.setup()
    open()
    renderRoute('/perguntas-frequentes')
    await questionButton(/Preciso criar conta/)

    await user.type(screen.getByRole('searchbox'), 'xyzzy')

    expect(screen.getByText('Nenhuma pergunta com essas palavras.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Falar no WhatsApp' })).toHaveAttribute('href', 'https://wa.me/5511953968344')
    expect(screen.getByRole('link', { name: 'Escrever uma mensagem' })).toHaveAttribute('href', '/contato')
  })

  it('does not submit the search as a page load', async () => {
    const user = userEvent.setup()
    open()
    renderRoute('/perguntas-frequentes')
    await questionButton(/Preciso criar conta/)

    await user.type(screen.getByRole('searchbox'), 'imagem{Enter}')

    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent('1 pergunta encontrada')
  })

  it('says it is loading, then says when the load failed and tries again', async () => {
    const user = userEvent.setup()
    let fail = true
    open({ 'GET /faq': () => (fail ? { status: 500, data: { error: { code: 'internal_error', message: 'x' } } } : { status: 200, data: { data: PUBLIC_FAQ } }) })
    renderRoute('/perguntas-frequentes')

    expect(await screen.findByText('Não conseguimos carregar as perguntas')).toBeInTheDocument()
    fail = false
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await questionButton(/Preciso criar conta/)).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Não conseguimos carregar as perguntas')).not.toBeInTheDocument())
  })

  it('has no section and no error when nothing is on air: it says so and points to the contact', async () => {
    open({ 'GET /faq': () => ({ status: 200, data: { data: [] } }) })
    renderRoute('/perguntas-frequentes')

    expect(await screen.findByText('Ainda não há perguntas por aqui')).toBeInTheDocument()
    expect(within(screen.getByRole('main')).queryAllByRole('button', { name: /\?/ })).toHaveLength(0)
  })
})

describe('where the question shows up (design 18c)', () => {
  it('is in the footer and in the help group of both menus', () => {
    open()
    expect(MENU_GROUPS.find((group) => group.title === 'Ajuda')?.items.map((item) => item.to)).toContain('/perguntas-frequentes')
    expect(DESKTOP_MENU_GROUPS.find((group) => group.title === 'Ajuda')?.items.map((item) => item.to)).toContain('/perguntas-frequentes')
    renderRoute('/')
    expect(within(screen.getByRole('contentinfo')).getByRole('link', { name: 'Perguntas frequentes' })).toHaveAttribute('href', '/perguntas-frequentes')
  })

  it('links the schools page to the two school questions, straight to their addresses', () => {
    renderRoute('/para-escolas')
    const main = within(screen.getByRole('main'))

    expect(main.getByRole('link', { name: 'O que a escola precisa providenciar?' })).toHaveAttribute('href', '/perguntas-frequentes#escola-providenciar')
    expect(main.getByRole('link', { name: 'Quanto dura e qual é a classificação?' })).toHaveAttribute('href', '/perguntas-frequentes#escola-duracao')
  })

  it('links the contact page, above the form, to the whole list', () => {
    renderRoute('/contato')

    expect(screen.getByRole('link', { name: 'Talvez já esteja respondido: perguntas frequentes' })).toHaveAttribute('href', '/perguntas-frequentes')
  })
})
