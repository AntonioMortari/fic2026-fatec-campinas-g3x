import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiError, fakeUser, mockApi } from './auth-support'
import { renderRoute } from './render'

let mock: ReturnType<typeof mockApi>
afterEach(() => mock?.restore())

const STAFF = { ...fakeUser, isStaff: true }
const EVENT = '11111111-1111-4111-8111-111111111111'
const MISSING = apiError(404, 'not_found', 'Rota GET /api/x não existe.')
const HINT = /a API está desatualizada/

function openWith(handlers: Parameters<typeof mockApi>[0]) {
  localStorage.setItem('af-session', '1')
  mock = mockApi({ 'POST /auth/refresh': () => ({ status: 200, data: { token: 'a.b.c', user: STAFF } }), ...handlers })
}

// A route the running API does not have answers 404 as well: the person must read "out of date", not "page not found".
describe('an API that is older than the front end', () => {
  it('says so on the attendance list, and does not call it a missing page', async () => {
    openWith({ [`GET /admin/events/${EVENT}/attendance`]: () => MISSING })
    renderRoute(`/admin/eventos/${EVENT}/presenca`)

    expect(await screen.findByText(HINT)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Página não encontrada' })).not.toBeInTheDocument()
  })

  it('says so on the report', async () => {
    openWith({ 'GET /admin/report': () => MISSING })
    renderRoute('/admin/relatorio')

    expect(await screen.findByText(HINT)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Página não encontrada' })).not.toBeInTheDocument()
  })

  it('says so on "Minhas inscrições"', async () => {
    openWith({ 'GET /auth/me': () => ({ status: 200, data: { user: STAFF } }), 'GET /me/registrations': () => MISSING })
    renderRoute('/minha-conta')

    expect(await screen.findByText(HINT)).toBeInTheDocument()
  })

  it('keeps the plain message for any other failure', async () => {
    openWith({ 'GET /auth/me': () => ({ status: 200, data: { user: STAFF } }), 'GET /me/registrations': () => apiError(500, 'internal_error', 'x') })
    renderRoute('/minha-conta')

    expect(await screen.findByText('Não conseguimos carregar suas inscrições')).toBeInTheDocument()
    expect(screen.queryByText(HINT)).not.toBeInTheDocument()
  })
})
