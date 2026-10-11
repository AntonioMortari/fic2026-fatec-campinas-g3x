import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CONTACTS } from '../lib/contacts'
import { DESKTOP_NAV, isMenuRoute } from '../lib/navigation'
import { api } from '../services/api'
import { apiError, mockApi } from './auth-support'
import { renderRoute } from './render'

let mock: ReturnType<typeof mockApi>
let scrollTo: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
})
afterEach(() => mock?.restore())

const RECEIVED = { status: 201, data: { received: true } }
const serve = (reply: () => { status: number; data: unknown } | 'network-error' = () => RECEIVED) => {
  mock = mockApi({ 'POST /contacts': reply })
}
const posts = () => mock.requests.filter((request) => request.method === 'POST' && request.url === '/contacts')

type User = ReturnType<typeof userEvent.setup>
const box = (name: RegExp | string) => screen.getByRole('textbox', { name })
const submit = (user: User) => user.click(screen.getByRole('button', { name: 'Enviar mensagem' }))

async function fillValid(user: User) {
  await user.type(box('Seu nome'), 'Regina Lima')
  await user.type(box('E-mail'), 'regina.lima@exemplo.com')
  await user.type(box(/^Mensagem/), 'Gostaríamos de levar duas turmas.')
  await user.click(screen.getByRole('checkbox', { name: /Concordo que o Ateliê/ }))
}

describe('the contact page (designs 10a and 10h)', () => {
  it('opens with the overline, the title and the lead, and the two quick actions', () => {
    renderRoute('/contato')

    expect(screen.getByText('Contato', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Fale com a gente' })).toBeInTheDocument()
    expect(screen.getByText(/Escolas, instituições, empresas, imprensa ou qualquer pessoa que queira conhecer o ateliê/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Chamar no WhatsApp' })).toHaveAttribute('href', CONTACTS.whatsapp)
    expect(screen.getByRole('link', { name: 'Ligar' })).toHaveAttribute('href', 'tel:+5511953968344')
  })

  it('lists the six direct channels with the real links', () => {
    renderRoute('/contato')

    const channels = screen.getByRole('region', { name: 'Canais diretos' })
    const rows = within(channels)
      .getAllByRole('link')
      .map((link) => [link.textContent, link.getAttribute('href')])
    expect(rows).toEqual([
      ['(11) 95396-8344', 'tel:+5511953968344'],
      ['(11) 95396-8344', 'https://wa.me/5511953968344'],
      ['atelieafro@gmail.com', 'mailto:atelieafro@gmail.com'],
      ['@atelie_afrocultural', 'https://instagram.com/atelie_afrocultural'],
      ['@ateli.afro.cultur', 'https://tiktok.com/@ateli.afro.cultur'],
      ['Nosso canal', 'https://www.youtube.com/channel/UCWeZ-53etejdUzUi3eR81zg'],
    ])
    expect(within(channels).getAllByRole('term').map((term) => term.textContent)).toEqual(['Telefone', 'WhatsApp', 'E-mail', 'Instagram', 'TikTok', 'YouTube'])
  })

  it('reads the direct channels before the form', () => {
    renderRoute('/contato')

    const channels = screen.getByRole('region', { name: 'Canais diretos' })
    const form = screen.getByRole('region', { name: 'Ou mande uma mensagem por aqui' })
    expect(channels.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('says where the headquarters is, in writing, and shows the map with an accessible title', () => {
    renderRoute('/contato')

    const where = screen.getByRole('region', { name: 'Onde estamos' })
    expect(where).toHaveTextContent('Rua Dr. Paulo Gatti, 135 — Vila Romero')
    expect(where).toHaveTextContent('São Paulo/SP — CEP 02468-030')
    expect(within(where).getByText('Nossa sede fica no bairro da Casa Verde, zona norte de São Paulo.')).toBeInTheDocument()
    const map = within(where).getByTitle('Mapa da sede do Ateliê Afro Cultural')
    expect(map.tagName).toBe('IFRAME')
    expect(map).toHaveAttribute('loading', 'lazy')
    expect(map.getAttribute('src')).toContain(encodeURIComponent('Rua Dr. Paulo Gatti, 135'))
    expect(map.getAttribute('src')).toContain('02468-030')
  })

  it('asks for the name, e-mail and message, and makes the phone and the institution optional', () => {
    renderRoute('/contato')

    expect(box('Seu nome')).toBeRequired()
    expect(box('E-mail')).toBeRequired()
    expect(box('E-mail')).toHaveAttribute('type', 'email')
    expect(box(/^Mensagem/)).toBeRequired()
    expect(box(/^Telefone/)).not.toBeRequired()
    expect(box(/^Telefone/)).toHaveAttribute('type', 'tel')
    expect(box(/^Instituição/)).not.toBeRequired()
    expect(screen.getAllByText('opcional')).toHaveLength(2)
    expect(screen.getByText('É por aqui que respondemos.')).toBeInTheDocument()
    expect(screen.getByText('Com DDD, como (11) 95396-8344.')).toBeInTheDocument()
    expect(screen.getByText('Escola, empresa, coletivo, imprensa.')).toBeInTheDocument()
    expect(screen.getByText('Conte o que você precisa. Não tem forma certa.')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Concordo que o Ateliê use estes dados para responder minha mensagem.' })).not.toBeChecked()
  })

  it('shows the privacy sentence without linking to a page that does not exist yet', () => {
    renderRoute('/contato')

    const sentence = screen.getByText(/Usamos o que você escrever aqui só para responder você/)
    expect(sentence).toHaveTextContent('O que guardamos, por quanto tempo, e como pedir a exclusão está na política de privacidade.')
    expect(within(sentence).queryByRole('link')).not.toBeInTheDocument()
    const main = document.getElementById('content') as HTMLElement
    expect(main.querySelectorAll('a[href*="privacidade"]')).toHaveLength(0)
  })

  it('does not show the "received" box before anything is sent', () => {
    renderRoute('/contato')

    expect(screen.queryByText('Mensagem recebida')).not.toBeInTheDocument()
  })
})

describe('sending the message', () => {
  it('sends exactly the six fields the form has, and nothing else', async () => {
    const user = userEvent.setup()
    serve()
    renderRoute('/contato')
    await fillValid(user)
    await user.type(box(/^Telefone/), '(11) 95396-8344')
    await user.type(box(/^Instituição/), 'EMEF Jardim São Bento')

    await submit(user)

    await waitFor(() => expect(posts()).toHaveLength(1))
    expect(posts()[0]!.body).toEqual({
      name: 'Regina Lima',
      email: 'regina.lima@exemplo.com',
      phone: '(11) 95396-8344',
      institution: 'EMEF Jardim São Bento',
      message: 'Gostaríamos de levar duas turmas.',
      consent: true,
    })
  })

  it('shows "Enviando…" and blocks a second send while it waits', async () => {
    const user = userEvent.setup()
    const post = vi.spyOn(api, 'post').mockReturnValue(new Promise(() => undefined))
    renderRoute('/contato')
    await fillValid(user)

    await submit(user)

    const button = await screen.findByRole('button', { name: 'Enviando…' })
    expect(button).toBeDisabled()
    await user.click(button)
    expect(post).toHaveBeenCalledTimes(1)
  })

  it('on success shows the real confirmation with the WhatsApp button, on top, and clears the form', async () => {
    const user = userEvent.setup()
    serve()
    renderRoute('/contato')
    await fillValid(user)

    await submit(user)

    const received = (await screen.findByText('Mensagem recebida')).closest('[role="status"]') as HTMLElement
    expect(within(received).getByRole('heading', { name: 'Mensagem recebida' })).toBeInTheDocument()
    expect(received).toHaveTextContent('Ela ficou registrada com o Ateliê. Se for urgente, chame no WhatsApp (11) 95396-8344: é o caminho mais rápido.')
    expect(within(received).getByRole('link', { name: 'Chamar no WhatsApp' })).toHaveAttribute('href', CONTACTS.whatsapp)
    expect(received).toHaveFocus()
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
    expect(box('Seu nome')).toHaveValue('')
    expect(box('E-mail')).toHaveValue('')
    expect(box(/^Mensagem/)).toHaveValue('')
    expect(screen.getByRole('checkbox', { name: /Concordo que o Ateliê/ })).not.toBeChecked()
    expect(screen.getByRole('heading', { level: 1, name: 'Fale com a gente' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Canais diretos' })).toBeInTheDocument()
  })

  it('does not bring the confirmation back when the page is opened again', async () => {
    const user = userEvent.setup()
    serve()
    renderRoute('/contato')
    await fillValid(user)
    await submit(user)
    await screen.findByText('Mensagem recebida')
    document.body.innerHTML = ''

    renderRoute('/contato')

    expect(screen.queryByText('Mensagem recebida')).not.toBeInTheDocument()
  })

  it('marks the field the server refused, keeps what was typed and puts the focus there', async () => {
    const user = userEvent.setup()
    serve(() => apiError(400, 'invalid_data', 'Confira os dados enviados.', [{ field: 'email', message: 'Falta o @. Exemplo: nome@exemplo.com.' }]))
    renderRoute('/contato')
    await fillValid(user)

    await submit(user)

    expect(await screen.findByRole('alert')).toHaveTextContent('Confira o e-mail marcado abaixo.')
    expect(box('E-mail')).toHaveAttribute('aria-invalid', 'true')
    expect(box('E-mail')).toHaveAccessibleDescription('Falta o @. Exemplo: nome@exemplo.com.')
    expect(box('E-mail')).toHaveFocus()
    expect(box('Seu nome')).toHaveValue('Regina Lima')
    expect(box('E-mail')).toHaveValue('regina.lima@exemplo.com')
    expect(box(/^Mensagem/)).toHaveValue('Gostaríamos de levar duas turmas.')
    expect(screen.queryByText('Mensagem recebida')).not.toBeInTheDocument()
  })

  it('says "campos marcados" when more than one field is wrong, and marks each', async () => {
    const user = userEvent.setup()
    serve(() =>
      apiError(400, 'invalid_data', 'Confira os dados enviados.', [
        { field: 'name', message: 'Escreva seu nome.' },
        { field: 'phone', message: 'O telefone precisa incluir o DDD, como (11) 95396-8344.' },
      ]),
    )
    renderRoute('/contato')
    await submit(user)

    expect(await screen.findByRole('alert')).toHaveTextContent('Confira os campos marcados abaixo.')
    expect(box('Seu nome')).toHaveAttribute('aria-invalid', 'true')
    expect(box(/^Telefone/)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Escreva seu nome.')).toBeInTheDocument()
  })

  it('marks the consent box when it is the one missing', async () => {
    const user = userEvent.setup()
    serve(() => apiError(400, 'invalid_data', 'Confira os dados enviados.', [{ field: 'consent', message: 'Para enviar, precisamos que você concorde com o uso dos seus dados para responder esta mensagem.' }]))
    renderRoute('/contato')

    await submit(user)

    expect(await screen.findByRole('alert')).toHaveTextContent('Confira a concordância marcada abaixo.')
    expect(screen.getByRole('checkbox', { name: /Concordo que o Ateliê/ })).toHaveAttribute('aria-invalid', 'true')
  })

  it('tells the person the connection is over the limit, in plain words, and keeps the text', async () => {
    const user = userEvent.setup()
    serve(() => apiError(429, 'too_many_requests', 'Chegaram muitas mensagens por esta conexão. Tente de novo daqui a pouco ou chame no WhatsApp.'))
    renderRoute('/contato')
    await fillValid(user)

    await submit(user)

    expect(await screen.findByRole('alert')).toHaveTextContent('Chegaram muitas mensagens por esta conexão. Tente de novo daqui a pouco ou chame no WhatsApp.')
    expect(box(/^Mensagem/)).toHaveValue('Gostaríamos de levar duas turmas.')
    expect(box('E-mail')).not.toHaveAttribute('aria-invalid')
  })

  it('tells the person when the server cannot be reached, and keeps the text', async () => {
    const user = userEvent.setup()
    serve(() => 'network-error')
    renderRoute('/contato')
    await fillValid(user)

    await submit(user)

    expect(await screen.findByRole('alert')).toHaveTextContent('Não conseguimos falar com o servidor. Confira a conexão e tente de novo.')
    expect(box('Seu nome')).toHaveValue('Regina Lima')
    expect(screen.queryByText('Mensagem recebida')).not.toBeInTheDocument()
  })

  it('does not promise any reply deadline', async () => {
    const user = userEvent.setup()
    serve()
    renderRoute('/contato')
    await fillValid(user)
    await submit(user)

    const received = (await screen.findByText('Mensagem recebida')).closest('[role="status"]') as HTMLElement

    expect(received.textContent).not.toMatch(/\d+\s*(horas|dias|h\b)|em até|prazo/i)
  })
})

describe('where the page sits in the navigation', () => {
  it('marks "Mais" in the header on /contato and not on the home', () => {
    renderRoute('/contato')
    expect(screen.getByRole('button', { name: /^Mais/ })).toHaveAttribute('data-current-section', 'true')
  })

  it('does not mark "Mais" on a page the header already shows', () => {
    renderRoute('/agenda')
    expect(screen.getByRole('button', { name: /^Mais/ })).not.toHaveAttribute('data-current-section')
  })

  it('marks "Menu" in the bottom bar on /contato, and not on the agenda', () => {
    renderRoute('/contato')
    const bar = screen.getByRole('navigation', { name: 'Atalhos' })
    expect(within(bar).getByRole('button', { name: 'Menu' }).className).toContain('font-bold')

    document.body.innerHTML = ''
    renderRoute('/agenda')
    expect(within(screen.getByRole('navigation', { name: 'Atalhos' })).getByRole('button', { name: 'Menu' }).className).not.toContain('font-bold')
  })

  it('decides from the menu lists, not from a hand-written path', () => {
    expect(isMenuRoute('/contato', DESKTOP_NAV)).toBe(true)
    expect(isMenuRoute('/contato/qualquer', DESKTOP_NAV)).toBe(true)
    expect(isMenuRoute('/agenda', DESKTOP_NAV)).toBe(false)
    expect(isMenuRoute('/', DESKTOP_NAV)).toBe(false)
    expect(isMenuRoute('/quem-somos', DESKTOP_NAV)).toBe(false)
  })

  it('is a real page, not the 404', () => {
    renderRoute('/contato')
    expect(screen.queryByText(/Página não encontrada/i)).not.toBeInTheDocument()
  })
})
