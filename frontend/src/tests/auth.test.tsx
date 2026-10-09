import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getToken } from '../services/session'
import { apiError, fakeUser, mockApi } from './auth-support'
import { renderRoute } from './render'

const TOKEN = 'header.payload.signature'

let mock: ReturnType<typeof mockApi>
afterEach(() => mock?.restore())

async function fillLogin(user: ReturnType<typeof userEvent.setup>, email = 'maria@example.com', password = 'senha-segura-1') {
  await user.type(screen.getByLabelText(/^E-mail/), email)
  await user.type(screen.getByLabelText(/^Senha/), password)
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('login', () => {
  beforeEach(() => {
    mock = mockApi({
      'POST /auth/login': ({ body }) =>
        (body as { password: string }).password === 'senha-segura-1'
          ? { status: 200, data: { token: TOKEN, user: fakeUser } }
          : apiError(401, 'invalid_credentials', 'E-mail ou senha não conferem.'),
      'GET /auth/me': () => ({ status: 200, data: { user: fakeUser } }),
    })
  })

  it('keeps the token in memory only, never in web storage or cookies', async () => {
    const user = userEvent.setup()
    renderRoute('/entrar')
    await fillLogin(user)

    await waitFor(() => expect(getToken()).toBe(TOKEN))
    expect(JSON.stringify({ ...localStorage })).not.toContain(TOKEN)
    expect(JSON.stringify({ ...sessionStorage })).not.toContain(TOKEN)
    expect(document.cookie).not.toContain(TOKEN)
  })

  it('goes to the page the person came from after signing in', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/entrar?voltar=%2Fagenda')
    expect(screen.getByText('Agenda', { selector: 'strong' })).toBeInTheDocument()
    await fillLogin(user)

    await waitFor(() => expect(router.state.location.pathname).toBe('/agenda'))
  })

  it.each(['//evil.example', 'https://evil.example', '/\\evil', '/entrar', '/a?b=1'])('ignores the unsafe destination %s', async (voltar) => {
    const user = userEvent.setup()
    const router = renderRoute(`/entrar?voltar=${encodeURIComponent(voltar)}`)
    await fillLogin(user)

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })

  it('shows the generic message and keeps the e-mail when the credentials fail', async () => {
    const user = userEvent.setup()
    renderRoute('/entrar')
    await fillLogin(user, 'maria@example.com', 'errada')

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha não conferem.')
    expect(screen.getByLabelText(/^E-mail/)).toHaveValue('maria@example.com')
    expect(getToken()).toBeNull()
  })

  it('does not announce an expired session for a wrong password', async () => {
    const user = userEvent.setup()
    renderRoute('/entrar')
    await fillLogin(user, 'maria@example.com', 'errada')

    await screen.findByRole('alert')
    expect(screen.queryByText(/sessão terminou/i)).not.toBeInTheDocument()
  })

  it('has no dead recovery link', () => {
    renderRoute('/entrar')
    expect(screen.queryByText(/esqueci/i)).not.toBeInTheDocument()
  })
})

describe('protected routes and session end', () => {
  beforeEach(() => {
    mock = mockApi({
      'POST /auth/login': () => ({ status: 200, data: { token: TOKEN, user: fakeUser } }),
      'GET /auth/me': ({ authorization }) =>
        authorization === `Bearer ${TOKEN}`
          ? { status: 200, data: { user: fakeUser } }
          : apiError(401, 'unauthenticated', 'Entre na sua conta para continuar.'),
    })
  })

  it('sends someone without a session to /entrar and remembers where they were going', async () => {
    const router = renderRoute('/minha-conta')

    await waitFor(() => expect(router.state.location.pathname).toBe('/entrar'))
    expect(router.state.location.search).toBe('?voltar=%2Fminha-conta')
    expect(mock.requests).toHaveLength(0)
  })

  it('sends the token on later requests and shows the account sheet', async () => {
    const user = userEvent.setup()
    renderRoute('/entrar?voltar=%2Fminha-conta')
    await fillLogin(user)

    expect(await screen.findByText('maria@example.com')).toBeInTheDocument()
    expect(mock.requests.find((request) => request.url === '/auth/me')?.authorization).toBe(`Bearer ${TOKEN}`)
    expect(mock.requests.find((request) => request.url === '/auth/login')?.authorization).toBeUndefined()
  })

  it('drops the session and explains it when the API answers 401 to an authenticated request', async () => {
    const user = userEvent.setup()
    mock.restore()
    mock = mockApi({
      'POST /auth/login': () => ({ status: 200, data: { token: TOKEN, user: fakeUser } }),
      'GET /auth/me': () => apiError(401, 'unauthenticated', 'Sua sessão terminou.'),
    })
    const router = renderRoute('/entrar?voltar=%2Fminha-conta')
    await fillLogin(user)

    await waitFor(() => expect(router.state.location.pathname).toBe('/entrar'))
    expect(await screen.findByText('Sua sessão terminou. Entre de novo para continuar.')).toBeInTheDocument()
    expect(getToken()).toBeNull()
  })
})

describe('header and menu when signed in', () => {
  beforeEach(() => {
    mock = mockApi({
      'POST /auth/login': () => ({ status: 200, data: { token: TOKEN, user: fakeUser } }),
      'GET /auth/me': () => ({ status: 200, data: { user: fakeUser } }),
    })
  })

  async function signIn() {
    const user = userEvent.setup()
    const router = renderRoute('/entrar?voltar=%2Fagenda')
    await fillLogin(user)
    await screen.findByRole('link', { name: /^Minha conta/ })
    expect(router.state.location.pathname).toBe('/agenda')
    return { user, router }
  }

  it('shows the first name instead of "Entrar", linking to the account', async () => {
    await signIn()
    const banner = screen.getAllByRole('banner')[0]!

    expect(within(banner).getByRole('link', { name: 'Minha conta, Maria da Silva' })).toHaveAttribute('href', '/minha-conta')
    expect(within(banner).getByText('Maria')).toBeInTheDocument()
    expect(within(banner).queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument()
  })

  it('signs out from the header: back to the start, no token, "Entrar" is back', async () => {
    const { user, router } = await signIn()
    await user.click(within(screen.getAllByRole('banner')[0]!).getByRole('button', { name: 'Sair' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(getToken()).toBeNull()
    expect(within(screen.getAllByRole('banner')[0]!).getByRole('link', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByText('Você saiu da conta.')).toBeInTheDocument()
  })

  it('signs out from a protected page and lands on the start, not on the sign-in screen', async () => {
    const { user, router } = await signIn()
    await router.navigate('/minha-conta')
    await user.click(await screen.findByRole('button', { name: 'Sair da conta' }))

    await waitFor(() => expect(getToken()).toBeNull())
    expect(router.state.location.pathname).toBe('/')
    expect(screen.getByText('Você saiu da conta.')).toBeInTheDocument()
  })

  it('offers the account block in the menu only when signed in', async () => {
    const { user } = await signIn()
    await user.click(screen.getByRole('button', { name: /Aa, acessibilidade/ }))

    const menu = screen.getByRole('dialog', { hidden: true })
    expect(within(menu).getByRole('link', { name: 'Minha conta', hidden: true })).toBeInTheDocument()
    expect(within(menu).getByRole('button', { name: 'Sair da conta', hidden: true })).toBeInTheDocument()
  })

  it('does not offer the account block in the menu to a visitor', async () => {
    const user = userEvent.setup()
    renderRoute('/agenda')
    await user.click(screen.getByRole('button', { name: /Aa, acessibilidade/ }))

    expect(screen.queryByText('Sua conta', { selector: 'h3' })).not.toBeInTheDocument()
  })
})
