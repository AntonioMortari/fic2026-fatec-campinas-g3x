import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider } from '../contexts/AuthProvider'
import { ReadingPreferencesProvider } from '../contexts/ReadingPreferencesProvider'
import { routes } from '../routes'
import { api } from '../services/api'
import { getToken } from '../services/session'
import { apiError, fakeUser, mockApi } from './auth-support'
import { renderRoute } from './render'

const FIRST = 'first.access.token'
const SECOND = 'second.access.token'

let mock: ReturnType<typeof mockApi>
afterEach(() => mock?.restore())

const hint = () => localStorage.getItem('af-session')
const calls = (url: string) => mock.requests.filter((request) => request.url === url)

describe('restoring the session when the page opens', () => {
  it('a visitor never asks for a session: no request, no flash of "Carregando"', async () => {
    mock = mockApi({})
    renderRoute('/')

    expect(screen.queryByText('Carregando sua conta…')).not.toBeInTheDocument()
    expect(mock.requests).toHaveLength(0)
  })

  it('with the cookie still good, a reload lands on the protected page signed in', async () => {
    localStorage.setItem('af-session', '1')
    mock = mockApi({
      'POST /auth/refresh': () => ({ status: 200, data: { token: FIRST, user: fakeUser } }),
      'GET /auth/me': () => ({ status: 200, data: { user: fakeUser } }),
    })
    const router = renderRoute('/minha-conta')

    expect(screen.getByText('Carregando sua conta…')).toBeInTheDocument()
    expect(await screen.findByText('maria@example.com')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/minha-conta')
    expect(getToken()).toBe(FIRST)
    expect(calls('/auth/refresh')[0]?.authorization).toBeUndefined()
  })

  it('asks only once even under StrictMode, because the cookie rotates on every use', async () => {
    localStorage.setItem('af-session', '1')
    mock = mockApi({
      'POST /auth/refresh': () => ({ status: 200, data: { token: FIRST, user: fakeUser } }),
      'GET /auth/me': () => ({ status: 200, data: { user: fakeUser } }),
    })
    render(
      <StrictMode>
        <ReadingPreferencesProvider>
          <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
            <AuthProvider>
              <RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/minha-conta'] })} />
            </AuthProvider>
          </QueryClientProvider>
        </ReadingPreferencesProvider>
      </StrictMode>,
    )

    await screen.findByText('maria@example.com')
    expect(calls('/auth/refresh')).toHaveLength(1)
  })

  it('shows the name in the header after the reload', async () => {
    localStorage.setItem('af-session', '1')
    mock = mockApi({ 'POST /auth/refresh': () => ({ status: 200, data: { token: FIRST, user: fakeUser } }) })
    renderRoute('/')

    expect(await screen.findByRole('link', { name: 'Minha conta, Maria da Silva' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument()
  })

  it('when the cookie is refused, sends to /entrar, explains it and forgets the hint', async () => {
    localStorage.setItem('af-session', '1')
    mock = mockApi({ 'POST /auth/refresh': () => apiError(401, 'session_expired', 'Sua sessão terminou.') })
    const router = renderRoute('/minha-conta')

    await waitFor(() => expect(router.state.location.pathname).toBe('/entrar'))
    expect(await screen.findByText('Sua sessão terminou. Entre de novo para continuar.')).toBeInTheDocument()
    expect(hint()).toBeNull()
    expect(getToken()).toBeNull()
  })

  it('when the server cannot be reached, does not claim the session ended and keeps the hint for next time', async () => {
    localStorage.setItem('af-session', '1')
    mock = mockApi({ 'POST /auth/refresh': () => 'network-error' })
    renderRoute('/entrar')

    expect(await screen.findByRole('tab', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.queryByText(/sessão terminou/i)).not.toBeInTheDocument()
    expect(hint()).toBe('1')
  })
})

describe('the hint', () => {
  beforeEach(() => {
    mock = mockApi({
      'POST /auth/login': () => ({ status: 200, data: { token: FIRST, user: fakeUser } }),
      'POST /auth/logout': () => ({ status: 204, data: null }),
      'GET /auth/me': () => ({ status: 200, data: { user: fakeUser } }),
    })
  })

  it('is set on sign-in, holds no token, and is cleared on sign-out together with the server cookie', async () => {
    const user = userEvent.setup()
    renderRoute('/entrar')
    await user.type(screen.getByLabelText(/^E-mail/), 'maria@example.com')
    await user.type(screen.getByLabelText(/^Senha/), 'senha-segura-1')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    await screen.findByRole('link', { name: /^Minha conta/ })

    expect(hint()).toBe('1')
    expect(JSON.stringify({ ...localStorage })).not.toContain(FIRST)

    await user.click(screen.getByRole('button', { name: 'Sair' }))
    await waitFor(() => expect(hint()).toBeNull())
    expect(calls('/auth/logout')).toHaveLength(1)
  })
})

describe('an access token that expires while the page is open', () => {
  it('is renewed silently and the request is repeated with the new token, once', async () => {
    mock = mockApi({
      'POST /auth/refresh': (() => {
        let count = 0
        return () => ({ status: 200, data: { token: ++count === 1 ? FIRST : SECOND, user: fakeUser } })
      })(),
      'GET /auth/me': ({ authorization }) =>
        authorization === `Bearer ${SECOND}` ? { status: 200, data: { user: fakeUser } } : apiError(401, 'unauthenticated', 'Expirou.'),
    })
    localStorage.setItem('af-session', '1')
    renderRoute('/minha-conta')

    expect(await screen.findByText('maria@example.com')).toBeInTheDocument()
    expect(calls('/auth/me').map((request) => request.authorization)).toEqual([`Bearer ${FIRST}`, `Bearer ${SECOND}`])
    expect(calls('/auth/refresh')).toHaveLength(2)
    expect(getToken()).toBe(SECOND)
  })

  it('shares one renewal between requests that fail together', async () => {
    mock = mockApi({
      'POST /auth/refresh': (() => {
        let count = 0
        return () => ({ status: 200, data: { token: ++count === 1 ? FIRST : SECOND, user: fakeUser } })
      })(),
      'GET /ping': ({ authorization }) =>
        authorization === `Bearer ${SECOND}` ? { status: 200, data: { ok: true } } : apiError(401, 'unauthenticated', 'Expirou.'),
    })
    localStorage.setItem('af-session', '1')
    renderRoute('/')
    await screen.findByRole('link', { name: /^Minha conta/ })

    const answers = await Promise.all([api.get('/ping'), api.get('/ping'), api.get('/ping')])

    expect(answers.map((answer) => answer.status)).toEqual([200, 200, 200])
    expect(calls('/auth/refresh')).toHaveLength(2)
  })

  it('does not loop: a request refused again after the renewal ends the session', async () => {
    mock = mockApi({
      'POST /auth/refresh': () => ({ status: 200, data: { token: FIRST, user: fakeUser } }),
      'GET /auth/me': () => apiError(401, 'unauthenticated', 'Sempre recusa.'),
    })
    localStorage.setItem('af-session', '1')
    const router = renderRoute('/minha-conta')

    await waitFor(() => expect(router.state.location.pathname).toBe('/entrar'))
    expect(calls('/auth/me')).toHaveLength(2)
    expect(calls('/auth/refresh')).toHaveLength(2)
    expect(getToken()).toBeNull()
  })

  it('a wrong password is not an expired session: no renewal is attempted', async () => {
    mock = mockApi({ 'POST /auth/login': () => apiError(401, 'invalid_credentials', 'E-mail ou senha não conferem.') })
    const user = userEvent.setup()
    renderRoute('/entrar')
    await user.type(screen.getByLabelText(/^E-mail/), 'maria@example.com')
    await user.type(screen.getByLabelText(/^Senha/), 'errada')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await screen.findByRole('alert')
    expect(calls('/auth/refresh')).toHaveLength(0)
  })
})

describe('requests', () => {
  it('always carry the cookie and the header that backs up SameSite', () => {
    expect(api.defaults.withCredentials).toBe(true)
    expect(api.defaults.headers['X-Requested-With']).toBe('fetch')
  })
})
