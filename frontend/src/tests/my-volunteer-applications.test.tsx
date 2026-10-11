import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { fakeUser, mockApi } from './auth-support'
import { renderRoute } from './render'
import { mine } from './volunteering-support'

type Handlers = Parameters<typeof mockApi>[0]

let mock: ReturnType<typeof mockApi>
afterEach(() => mock?.restore())

const ENDED = mine({ id: 'a0', status: 'ended', createdAt: '2025-03-10T12:00:00.000Z', areas: [{ id: 'producao-eventos', name: 'Produção de eventos' }] })

function open(applications: unknown[] | 'network-error', handlers: Handlers = {}, signedIn = true) {
  if (signedIn) localStorage.setItem('af-session', '1')
  mock = mockApi({
    'POST /auth/refresh': () => (signedIn ? { status: 200, data: { token: 'a.b.c', user: fakeUser } } : { status: 401, data: {} }),
    'GET /auth/me': () => ({ status: 200, data: { user: fakeUser } }),
    'GET /me/registrations': () => ({ status: 200, data: { data: [] } }),
    'GET /me/volunteer-applications': () => (applications === 'network-error' ? 'network-error' : { status: 200, data: { data: applications } }),
    ...handlers,
  })
}

describe('my volunteer applications (design 10g)', () => {
  it('needs a session: without one the person is sent to sign in and comes back', async () => {
    open([], {}, false)
    const router = renderRoute('/minha-conta/candidaturas')

    await waitFor(() => expect(router.state.location.pathname).toBe('/entrar'))
    expect(router.state.location.search).toBe('?voltar=%2Fminha-conta%2Fcandidaturas')
  })

  it('lists each application with its situation in the words of the person, the date and the areas', async () => {
    open([mine(), ENDED])
    renderRoute('/minha-conta/candidaturas')

    expect(await screen.findByRole('heading', { level: 1, name: 'Minhas candidaturas ao voluntariado' })).toBeInTheDocument()
    const rows = within(await screen.findByRole('list', { name: 'Candidaturas' })).getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('Recebida, ainda sem resposta')
    expect(rows[0]).toHaveTextContent('9 out 2026')
    expect(rows[0]).toHaveTextContent('Apoio pedagógico e oficinas · Comunicação e mídias')
    expect(rows[1]).toHaveTextContent('Encerrada')
    expect(rows[1]).toHaveTextContent('mar 2025')
    expect(rows[1]).toHaveTextContent('Produção de eventos')
  })

  it('never uses the staff words here', async () => {
    open([mine({ status: 'in_contact' }), mine({ id: 'a2', status: 'ended' })])
    renderRoute('/minha-conta/candidaturas')

    expect(await screen.findByText('A ONG está falando com você')).toBeInTheDocument()
    expect(screen.queryByText(/^(Nova|Em contato|Voluntariando)$/)).not.toBeInTheDocument()
  })

  it('keeps the ended ones at the bottom, grey, and never hides them', async () => {
    open([mine({ status: 'volunteering' }), ENDED])
    renderRoute('/minha-conta/candidaturas')

    const rows = within(await screen.findByRole('list', { name: 'Candidaturas' })).getAllByRole('listitem')
    expect(rows[1]).toBe(rows.at(-1))
    expect(within(rows[1]!).getByRole('heading', { name: 'Encerrada' })).toHaveClass('text-brown-400')
    expect(within(rows[0]!).getByRole('heading', { name: 'Voluntariado ativo' })).not.toHaveClass('text-brown-400')
  })

  it('offers "Candidatar-se" only when there is no live application', async () => {
    open([ENDED])
    renderRoute('/minha-conta/candidaturas')

    expect(await screen.findByRole('link', { name: 'Candidatar-se' })).toHaveAttribute('href', '/voluntariado/candidatura')
    expect(screen.queryByRole('link', { name: 'página de voluntariado' })).not.toBeInTheDocument()
  })

  it('with a live application, links to the areas instead of offering a second application', async () => {
    open([mine(), ENDED])
    renderRoute('/minha-conta/candidaturas')

    expect(await screen.findByRole('link', { name: 'página de voluntariado' })).toHaveAttribute('href', '/voluntariado')
    expect(screen.queryByRole('link', { name: 'Candidatar-se' })).not.toBeInTheDocument()
  })

  it('has no link to the notice board, which does not exist', async () => {
    open([mine()])
    renderRoute('/minha-conta/candidaturas')

    await screen.findByText('Recebida, ainda sem resposta')
    expect(screen.queryByText(/mural de avisos/i)).not.toBeInTheDocument()
  })

  it('says there is nothing yet, and offers to apply', async () => {
    open([])
    renderRoute('/minha-conta/candidaturas')

    expect(await screen.findByText('Você ainda não se candidatou')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Candidatar-se' })).toBeInTheDocument()
  })

  it('says it could not load, and tries again', async () => {
    const user = userEvent.setup()
    let attempts = 0
    open([], {
      'GET /me/volunteer-applications': () => (++attempts === 1 ? 'network-error' : { status: 200, data: { data: [mine()] } }),
    })
    renderRoute('/minha-conta/candidaturas')

    expect(await screen.findByText('Não conseguimos carregar suas candidaturas')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByText('Recebida, ainda sem resposta')).toBeInTheDocument()
  })

  it('goes back to the account', async () => {
    open([mine()])
    renderRoute('/minha-conta/candidaturas')

    const back = (await screen.findAllByRole('link', { name: /Sua conta/ })).filter((link) => link.getAttribute('href') === '/minha-conta')
    expect(back.length).toBeGreaterThan(0)
  })
})

describe('the item in the account page (design 7a)', () => {
  it.each([
    [[mine()], '1 em análise'],
    [[mine({ status: 'in_contact' })], '1 em análise'],
    [[mine({ status: 'volunteering' })], 'Voluntariado ativo'],
    [[ENDED], '1 encerrada'],
    [[ENDED, mine({ id: 'a3', status: 'ended' })], '2 encerradas'],
    [[], 'Nenhuma ainda'],
  ])('describes %# as "%s"', async (applications, words) => {
    open(applications)
    renderRoute('/minha-conta')

    const link = await screen.findByRole('link', { name: /Candidaturas ao voluntariado/ })
    expect(link).toHaveAttribute('href', '/minha-conta/candidaturas')
    expect(await within(link).findByText(words)).toBeInTheDocument()
  })

  it('still shows the item, without a count, when the list fails to load', async () => {
    open('network-error')
    renderRoute('/minha-conta')

    const link = await screen.findByRole('link', { name: /Candidaturas ao voluntariado/ })
    expect(link).toHaveAttribute('href', '/minha-conta/candidaturas')
  })

  it('promises nothing else: no donations, no password row', async () => {
    open([])
    renderRoute('/minha-conta')

    await screen.findByRole('link', { name: /Candidaturas ao voluntariado/ })
    expect(screen.queryByText(/Minhas doações|Trocar minha senha/)).not.toBeInTheDocument()
  })
})
