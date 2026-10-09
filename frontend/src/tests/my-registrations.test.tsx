import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import type { MyRegistration } from '../types/my-registration'
import { apiError, fakeUser, mockApi } from './auth-support'
import { renderRoute } from './render'

let mock: ReturnType<typeof mockApi>
afterEach(() => mock?.restore())

const event = (overrides: Partial<MyRegistration['event']>): MyRegistration['event'] => ({
  id: 'e1',
  title: 'Oficina de turbantes',
  startsAt: '2030-11-20T18:00:00.000Z',
  endsAt: '2030-11-20T20:00:00.000Z',
  location: 'Casa Verde',
  isOver: false,
  ...overrides,
})

const registration = (overrides: Partial<MyRegistration>): MyRegistration => ({
  id: 'r1',
  name: 'Maria da Silva',
  registeredAt: '2030-10-01T12:00:00.000Z',
  attendanceRecorded: false,
  cancelCode: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  event: event({}),
  ...overrides,
})

function open(listing: () => { status: number; data: unknown } | 'network-error') {
  localStorage.setItem('af-session', '1')
  mock = mockApi({
    'POST /auth/refresh': () => ({ status: 200, data: { token: 'a.b.c', user: fakeUser } }),
    'GET /auth/me': () => ({ status: 200, data: { user: fakeUser } }),
    'GET /me/registrations': listing,
  })
}

describe('my registrations, in the account page (RF11)', () => {
  it('lists the upcoming ones and the ones that already happened, apart', async () => {
    open(() => ({
      status: 200,
      data: {
        data: [
          registration({ id: 'r0', event: event({ id: 'e0', title: 'Contação antiga', isOver: true, startsAt: '2030-01-10T18:00:00.000Z', endsAt: null }) }),
          registration({ id: 'r1', name: 'Filho da Maria' }),
        ],
      },
    }))
    renderRoute('/minha-conta')

    expect(await screen.findByRole('heading', { name: 'Minhas inscrições' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Próximas (1)' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Já aconteceram (1)' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Oficina de turbantes' })).toBeInTheDocument()
    expect(screen.getByText('Filho da Maria')).toBeInTheDocument()
    expect(screen.getByText(/Inscrição registrada/)).toBeInTheDocument()
    expect(screen.getByText(/Atividade encerrada/)).toBeInTheDocument()
  })

  it('says "presence registered" only when the staff marked it, and never says "absent"', async () => {
    open(() => ({
      status: 200,
      data: { data: [registration({ id: 'r1', attendanceRecorded: true, event: event({ isOver: true }) }), registration({ id: 'r2', event: event({ id: 'e2', title: 'Outra', isOver: true }) })] },
    }))
    renderRoute('/minha-conta')

    expect(await screen.findByText(/Presença registrada/)).toBeInTheDocument()
    expect(screen.getByText(/Atividade encerrada/)).toBeInTheDocument()
    expect(screen.queryByText(/ausente|faltou|não veio|falta/i)).not.toBeInTheDocument()
  })

  it('explains the empty state, including that sign-ups made without signing in are not tied to the account', async () => {
    open(() => ({ status: 200, data: { data: [] } }))
    renderRoute('/minha-conta')

    expect(await screen.findByText('Nenhuma inscrição nesta conta ainda')).toBeInTheDocument()
    expect(screen.getByText(/sem entrar na conta não ficam ligadas a ela/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver a agenda' })).toHaveAttribute('href', '/agenda')
  })

  it('says when it could not load, and tries again', async () => {
    const user = userEvent.setup()
    let attempts = 0
    open(() => (++attempts === 1 ? apiError(500, 'internal_error', 'x') : { status: 200, data: { data: [registration({})] } }))
    renderRoute('/minha-conta')

    await user.click(await screen.findByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByRole('heading', { name: 'Oficina de turbantes' })).toBeInTheDocument()
  })

  it('offers "Cancelar inscrição" only on the ones that still come, with the personal link', async () => {
    open(() => ({
      status: 200,
      data: {
        data: [
          registration({ id: 'r0', event: event({ id: 'e0', title: 'Contação antiga', isOver: true }) }),
          registration({ id: 'r1', cancelCode: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' }),
        ],
      },
    }))
    renderRoute('/minha-conta')
    await screen.findByRole('heading', { name: 'Oficina de turbantes' })

    const links = screen.getAllByRole('link', { name: /Cancelar inscrição/ })
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', '/inscricao/cancelar?c=dddddddd-dddd-4ddd-8ddd-dddddddddddd')
  })

  it('shows no contact data of the registration', async () => {
    open(() => ({ status: 200, data: { data: [registration({})] } }))
    renderRoute('/minha-conta')
    await screen.findByRole('heading', { name: 'Oficina de turbantes' })

    expect(screen.queryByText(/CPF|responsável/i)).not.toBeInTheDocument()
  })
})
