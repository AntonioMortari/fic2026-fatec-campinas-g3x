import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import type { AuthUser } from '../services/auth'
import { apiError, fakeUser, mockApi } from './auth-support'
import { renderRoute } from './render'

type Handlers = Parameters<typeof mockApi>[0]

let mock: ReturnType<typeof mockApi>
afterEach(() => mock?.restore())

const ACCOUNT: AuthUser = { ...fakeUser, name: 'Ana Paula Souza', email: 'ana@exemplo.com', phone: '11987654321' }

function open(handlers: Handlers = {}, account = ACCOUNT) {
  localStorage.setItem('af-session', '1')
  mock = mockApi({
    'POST /auth/refresh': () => ({ status: 200, data: { token: 'a.b.c', user: account } }),
    'GET /auth/me': () => ({ status: 200, data: { user: account } }),
    'GET /me/registrations': () => ({ status: 200, data: { data: [] } }),
    ...handlers,
  })
}

const calls = (key: string) => mock.requests.filter((request) => `${request.method} ${request.url}` === key)

describe('your account (design 7a)', () => {
  it('shows the data first, with the e-mail and why it does not change here, and no row that is not in the design', async () => {
    open()
    renderRoute('/minha-conta')

    expect(await screen.findByRole('heading', { name: 'Sua conta' })).toBeInTheDocument()
    expect(screen.getByText('Só você e a equipe do Ateliê enxergam esta página.')).toBeInTheDocument()
    const ficha = within(await screen.findByRole('region', { name: 'Seus dados' }))
    expect(ficha.getByText('Ana Paula Souza')).toBeInTheDocument()
    expect(ficha.getByText('(11) 98765-4321')).toBeInTheDocument()
    expect(ficha.getByText('Pessoa física')).toBeInTheDocument()
    expect(ficha.getByText('ana@exemplo.com')).toBeInTheDocument()
    expect(ficha.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', 'https://wa.me/5511953968344')
    expect(ficha.queryByText('Participação')).not.toBeInTheDocument()
  })

  it('writes "Empresa" for an organization, and says when there is no phone', async () => {
    open({}, { ...ACCOUNT, personType: 'organization', phone: null })
    renderRoute('/minha-conta')

    const ficha = within(await screen.findByRole('region', { name: 'Seus dados' }))
    expect(ficha.getByText('Empresa')).toBeInTheDocument()
    expect(ficha.getByText('Não informado')).toBeInTheDocument()
  })

  it('puts the editing behind a button that opens its own screen, not a drawer', async () => {
    open()
    renderRoute('/minha-conta')

    expect(await screen.findByRole('link', { name: 'Alterar meus dados' })).toHaveAttribute('href', '/minha-conta/dados')
    expect(screen.queryByRole('textbox', { name: /Nome/ })).not.toBeInTheDocument()
  })

  it('lists only the participations that exist: the registrations. Nothing is promised that is not built', async () => {
    open()
    renderRoute('/minha-conta')

    expect(await screen.findByRole('heading', { name: 'Minhas participações' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Minhas inscrições' })).toBeInTheDocument()
    expect(screen.queryByText(/Candidaturas ao voluntariado|Minhas doações|Trocar minha senha/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sair da conta' })).toBeInTheDocument()
  })
})

describe('changing my data (design 7b)', () => {
  const edit = () => renderRoute('/minha-conta/dados')

  it('opens on its own screen, prefilled, with the e-mail as text and not as a field', async () => {
    open()
    edit()

    expect(await screen.findByRole('heading', { name: 'Alterar meus dados' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Nome/)).toHaveValue('Ana Paula Souza')
    expect(screen.getByLabelText(/^Telefone/)).toHaveValue('(11) 98765-4321')
    expect(screen.getByRole('radio', { name: 'Pessoa física' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Empresa' })).not.toBeChecked()
    expect(screen.getByText('ana@exemplo.com')).toBeInTheDocument()
    expect(screen.queryByLabelText(/E-mail/)).not.toBeInTheDocument()
    expect(screen.getByText(/Não muda por aqui/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute('href', '/minha-conta')
  })

  it('sends only name, phone and type, with the session, and comes back to the account with the notice and the new name', async () => {
    const user = userEvent.setup()
    const saved = { ...ACCOUNT, name: 'Ana P. Souza', personType: 'organization' as const }
    open({ 'PATCH /me': () => ({ status: 200, data: { user: saved } }), 'GET /auth/me': () => ({ status: 200, data: { user: saved } }) })
    edit()

    await user.clear(await screen.findByLabelText(/^Nome/))
    await user.type(screen.getByLabelText(/^Nome/), 'Ana P. Souza')
    await user.click(screen.getByRole('radio', { name: 'Empresa' }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByRole('heading', { name: 'Sua conta' })).toBeInTheDocument()
    expect(screen.getByText('Seus dados foram atualizados.')).toBeInTheDocument()
    const ficha = within(await screen.findByRole('region', { name: 'Seus dados' }))
    expect(ficha.getByText('Ana P. Souza')).toBeInTheDocument()
    expect(ficha.getByText('Empresa')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Minha conta, Ana P. Souza' })).toBeInTheDocument()
    expect(calls('PATCH /me')[0]?.authorization).toBe('Bearer a.b.c')
    expect(calls('PATCH /me')[0]?.body).toEqual({ name: 'Ana P. Souza', phone: '(11) 98765-4321', personType: 'organization' })
  })

  it('shows the notice once: the redirect state is cleared, so reloading the page does not bring it back', async () => {
    const user = userEvent.setup()
    open({ 'PATCH /me': () => ({ status: 200, data: { user: ACCOUNT } }) })
    const router = edit()
    await user.click(await screen.findByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Seus dados foram atualizados.')).toBeInTheDocument()
    await waitFor(() => expect(router.state.location.state).toBeNull())
    expect(router.state.location.pathname).toBe('/minha-conta')
  })

  it('marks the phone, says so at the top and keeps what was typed when the server refuses it', async () => {
    const user = userEvent.setup()
    open({ 'PATCH /me': () => apiError(400, 'invalid_data', 'Confira os dados enviados.', [{ field: 'phone', message: 'Falta um dígito. Exemplo: (11) 98765-4321.' }]) })
    edit()

    await user.clear(await screen.findByLabelText(/^Telefone/))
    await user.type(screen.getByLabelText(/^Telefone/), '(11) 9876-432')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Confira o telefone marcado abaixo.')
    expect(screen.getByLabelText(/^Telefone/)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Falta um dígito. Exemplo: (11) 98765-4321.')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Telefone/)).toHaveValue('(11) 9876-432')
    expect(screen.getByLabelText(/^Nome/)).toHaveValue('Ana Paula Souza')
    expect(screen.getByRole('heading', { name: 'Alterar meus dados' })).toBeInTheDocument()
  })

  it('says "campos" when more than one is wrong, and says what happened when the network fails', async () => {
    const user = userEvent.setup()
    open({
      'PATCH /me': () =>
        calls('PATCH /me').length > 1
          ? 'network-error'
          : apiError(400, 'invalid_data', 'x', [
              { field: 'name', message: 'Escreva seu nome.' },
              { field: 'phone', message: 'Falta um dígito.' },
            ]),
    })
    edit()

    await user.click(await screen.findByRole('button', { name: 'Salvar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Confira os campos marcados abaixo.')

    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText(/Não conseguimos falar com o servidor/)).toBeInTheDocument()
  })

  it('sends someone without a session to sign in and back', async () => {
    mock = mockApi({})
    const router = renderRoute('/minha-conta/dados')

    await waitFor(() => expect(router.state.location.pathname).toBe('/entrar'))
    expect(router.state.location.search).toBe('?voltar=%2Fminha-conta%2Fdados')
  })
})
