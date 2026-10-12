import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import type { AdminEvent } from '../types/admin-event'
import { apiError, fakeUser, mockApi } from './auth-support'
import { renderRoute } from './render'

let mock: ReturnType<typeof mockApi>
afterEach(() => mock?.restore())

type Handlers = Parameters<typeof mockApi>[0]
const STAFF = { ...fakeUser, isStaff: true }
const ID = '11111111-1111-4111-8111-111111111111'

const saved: AdminEvent = {
  id: ID,
  title: 'Contação',
  description: null,
  category: null,
  startsAt: '2030-11-20T18:00:00.000Z',
  endsAt: null,
  location: null,
  ageRange: null,
  capacity: 30,
  spotsLeft: 30,
  registrationOnSite: true,
  registrationStatus: 'open',
  image: null,
  registrationCount: 0,
  requiresCpf: false,
  published: false,
  updatedAt: '2030-01-01T00:00:00.000Z',
}
const withPhoto: AdminEvent = { ...saved, image: { url: `/api/admin/events/${ID}/image?v=5`, alt: 'Uma foto antiga' } }

function openAs(handlers: Handlers = {}) {
  localStorage.setItem('af-session', '1')
  mock = mockApi({
    'POST /auth/refresh': () => ({ status: 200, data: { token: 'a.b.c', user: STAFF } }),
    'GET /admin/events': () => ({ status: 200, data: { data: [saved] } }),
    ...handlers,
  })
}

const calls = (key: string) => mock.requests.filter((request) => `${request.method} ${request.url}` === key)
const photo = (name = 'foto.png', type = 'image/png', bytes = 'abc') => new File([bytes], name, { type })

async function fillBasics(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText(/^Título/), 'Contação')
  await user.type(screen.getByLabelText(/^Dia/), '2030-11-20')
  await user.type(screen.getByLabelText(/^Início/), '15:00')
}

describe('inscription on the site (design 13d)', () => {
  it('starts on "Pelo site", with spots and CPF, and sends registrationOnSite true', async () => {
    const user = userEvent.setup()
    openAs({ 'POST /admin/events': () => ({ status: 201, data: { event: saved } }) })
    renderRoute('/admin/eventos/novo')
    await fillBasics(user)

    expect(screen.getByRole('radio', { name: 'Pelo site' })).toBeChecked()
    expect(screen.getByLabelText(/^Vagas/)).toBeInTheDocument()
    expect(screen.getByLabelText('Este evento exige CPF')).toBeInTheDocument()
    await user.type(screen.getByLabelText(/^Vagas/), '18')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(calls('POST /admin/events')).toHaveLength(1))
    expect(calls('POST /admin/events')[0]?.body).toMatchObject({ registrationOnSite: true, capacity: 18 })
  })

  it('"Sem inscrição pelo site" hides spots and CPF, explains itself, and sends no capacity and no CPF even if they were typed', async () => {
    const user = userEvent.setup()
    openAs({ 'POST /admin/events': () => ({ status: 201, data: { event: saved } }) })
    renderRoute('/admin/eventos/novo')
    await fillBasics(user)
    await user.type(screen.getByLabelText(/^Vagas/), '18')
    await user.click(screen.getByLabelText('Este evento exige CPF'))

    await user.click(screen.getByRole('radio', { name: 'Sem inscrição pelo site' }))

    expect(screen.queryByLabelText(/^Vagas/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Este evento exige CPF')).not.toBeInTheDocument()
    expect(screen.getByText(/A página do evento diz "Não precisa se inscrever"/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(calls('POST /admin/events')).toHaveLength(1))
    expect(calls('POST /admin/events')[0]?.body).toMatchObject({ registrationOnSite: false, capacity: null, requiresCpf: false })
  })

  it('shows an event saved without sign-up on the site as such', async () => {
    openAs({ [`GET /admin/events/${ID}`]: () => ({ status: 200, data: { event: { ...saved, registrationOnSite: false, capacity: null } } }) })
    renderRoute(`/admin/eventos/${ID}/editar`)

    expect(await screen.findByRole('radio', { name: 'Sem inscrição pelo site' })).toBeChecked()
    expect(screen.queryByLabelText(/^Vagas/)).not.toBeInTheDocument()
  })
})

describe('the photo field (design 13d, RN07)', () => {
  it('offers to choose a photo, with the help text, and asks nothing else until there is one', async () => {
    openAs()
    renderRoute('/admin/eventos/novo')

    expect(await screen.findByLabelText('Escolher foto')).toBeInTheDocument()
    expect(screen.getByText('JPG, PNG, GIF ou WebP, até 4 MB. Aparece no topo da página do evento.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Descrição da foto')).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /Declaro que existe autorização/ })).not.toBeInTheDocument()
  })

  it('asks for the description and the declaration, with the exact text of the design, once a photo is chosen', async () => {
    const user = userEvent.setup()
    openAs()
    renderRoute('/admin/eventos/novo')
    await user.upload(await screen.findByLabelText('Escolher foto'), photo())

    expect(await screen.findByLabelText('Descrição da foto')).toBeInTheDocument()
    expect(screen.getByLabelText('Descrição da foto')).toHaveAccessibleDescription('Obrigatória quando há foto — o banco recusa sem ela.')
    expect(
      screen.getByRole('checkbox', {
        name: 'Declaro que existe autorização de uso de imagem registrada para todas as pessoas que aparecem nesta foto — e, no caso de crianças e adolescentes, autorização de quem é responsável por elas.',
      }),
    ).not.toBeChecked()
    expect(screen.getByLabelText('Trocar foto')).toBeInTheDocument()
  })

  it('does not send anything without the description, and says it on the field', async () => {
    const user = userEvent.setup()
    openAs({ 'POST /admin/events': () => ({ status: 201, data: { event: saved } }) })
    renderRoute('/admin/eventos/novo')
    await fillBasics(user)
    await user.upload(screen.getByLabelText('Escolher foto'), photo())
    await user.click(await screen.findByRole('checkbox', { name: /Declaro/ }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Descreva a foto para quem não a enxerga.')).toBeInTheDocument()
    expect(screen.getByLabelText('Descrição da foto')).toHaveFocus()
    expect(calls('POST /admin/events')).toHaveLength(0)
  })

  it('does not send anything without the declaration: the photo does not go up, and neither does the event', async () => {
    const user = userEvent.setup()
    openAs({ 'POST /admin/events': () => ({ status: 201, data: { event: saved } }) })
    renderRoute('/admin/eventos/novo')
    await fillBasics(user)
    await user.upload(screen.getByLabelText('Escolher foto'), photo())
    await user.type(await screen.findByLabelText('Descrição da foto'), 'Uma foto')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Para subir a foto, confirme que existe autorização de uso de imagem.')).toBeInTheDocument()
    expect(calls('POST /admin/events')).toHaveLength(0)
    expect(calls(`PUT /admin/events/${ID}/image`)).toHaveLength(0)
  })

  it('saves the event, then sends the photo as base64 with the description and the declaration', async () => {
    const user = userEvent.setup()
    openAs({
      'POST /admin/events': () => ({ status: 201, data: { event: saved } }),
      [`PUT /admin/events/${ID}/image`]: () => ({ status: 200, data: { event: withPhoto } }),
    })
    const router = renderRoute('/admin/eventos/novo')
    await fillBasics(user)
    await user.upload(screen.getByLabelText('Escolher foto'), photo('foto.png', 'image/png', 'abc'))
    await user.type(await screen.findByLabelText('Descrição da foto'), '  Uma foto  ')
    await user.click(screen.getByRole('checkbox', { name: /Declaro/ }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/eventos'))
    expect(calls(`PUT /admin/events/${ID}/image`)[0]?.body).toEqual({ data: btoa('abc'), alt: 'Uma foto', authorized: true })
    expect(mock.requests.map((request) => `${request.method} ${request.url}`).filter((key) => key.includes('admin/events'))).toEqual(
      expect.arrayContaining(['POST /admin/events', `PUT /admin/events/${ID}/image`]),
    )
  })

  it('refuses a file that is not an image, with the sentence, and asks nothing about it', async () => {
    const user = userEvent.setup({ applyAccept: false })
    openAs()
    renderRoute('/admin/eventos/novo')
    await user.upload(await screen.findByLabelText('Escolher foto'), photo('nota.pdf', 'application/pdf'))

    expect(await screen.findByText('Escolha uma foto JPG, PNG, GIF ou WebP.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Descrição da foto')).not.toBeInTheDocument()
  })

  it('refuses a photo over 4 MB that cannot be reduced, with the limit sentence', async () => {
    const user = userEvent.setup()
    openAs()
    renderRoute('/admin/eventos/novo')
    await user.upload(await screen.findByLabelText('Escolher foto'), photo('grande.gif', 'image/gif', 'x'.repeat(4 * 1024 * 1024 + 1)))

    expect(await screen.findByText('A foto passou de 4 MB e não deu para reduzir. Escolha uma menor.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Descrição da foto')).not.toBeInTheDocument()
  })

  it('lets the person give up the new photo', async () => {
    const user = userEvent.setup()
    openAs()
    renderRoute('/admin/eventos/novo')
    await user.upload(await screen.findByLabelText('Escolher foto'), photo())
    await user.click(await screen.findByRole('button', { name: 'Não trocar a foto' }))

    expect(screen.queryByLabelText('Descrição da foto')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Escolher foto')).toBeInTheDocument()
  })

  it('when the photo fails after the event was saved, says so, goes to the edit page and does not save the event twice', async () => {
    const user = userEvent.setup()
    openAs({
      'POST /admin/events': () => ({ status: 201, data: { event: saved } }),
      [`PUT /admin/events/${ID}/image`]: () => apiError(400, 'invalid_image', 'O arquivo não é uma foto JPG, PNG, GIF ou WebP.'),
      [`GET /admin/events/${ID}`]: () => ({ status: 200, data: { event: saved } }),
    })
    const router = renderRoute('/admin/eventos/novo')
    await fillBasics(user)
    await user.upload(screen.getByLabelText('Escolher foto'), photo())
    await user.type(await screen.findByLabelText('Descrição da foto'), 'Uma foto')
    await user.click(screen.getByRole('checkbox', { name: /Declaro/ }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(router.state.location.pathname).toBe(`/admin/eventos/${ID}/editar`))
    expect(await screen.findByText(/O evento foi salvo, mas a foto não subiu: O arquivo não é uma foto JPG, PNG, GIF ou WebP\./)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Título/)).toHaveValue('Contação')
    expect(calls('POST /admin/events')).toHaveLength(1)
    expect(screen.queryByText('Rascunho salvo. Publique quando estiver pronto.')).not.toBeInTheDocument()
  })

  it('when editing, a failed photo keeps the person on the form with the warning, saved text and all', async () => {
    const user = userEvent.setup()
    openAs({
      [`GET /admin/events/${ID}`]: () => ({ status: 200, data: { event: saved } }),
      [`PUT /admin/events/${ID}`]: () => ({ status: 200, data: { event: saved } }),
      [`PUT /admin/events/${ID}/image`]: () => apiError(413, 'image_too_large', 'A foto passou de 4 MB. Escolha uma menor.'),
    })
    const router = renderRoute(`/admin/eventos/${ID}/editar`)
    await user.upload(await screen.findByLabelText('Escolher foto'), photo())
    await user.type(await screen.findByLabelText('Descrição da foto'), 'Uma foto')
    await user.click(screen.getByRole('checkbox', { name: /Declaro/ }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText(/O evento foi salvo, mas a foto não subiu: A foto passou de 4 MB/)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(`/admin/eventos/${ID}/editar`)
    expect(screen.getByLabelText(/^Título/)).toHaveValue('Contação')
  })

  it('shows the photo of an event, its description, and no declaration box until the photo is changed', async () => {
    openAs({
      [`GET /admin/events/${ID}`]: () => ({ status: 200, data: { event: withPhoto } }),
      [`GET /admin/events/${ID}/image?v=5`]: () => ({ status: 200, data: new Blob(['x'], { type: 'image/png' }) }),
    })
    renderRoute(`/admin/eventos/${ID}/editar`)

    expect(await screen.findByText('Uma foto antiga')).toBeInTheDocument()
    expect(screen.getByLabelText('Trocar foto')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remover foto' })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /Declaro/ })).not.toBeInTheDocument()
  })

  it('saving an event whose photo is kept sends no photo request at all', async () => {
    const user = userEvent.setup()
    openAs({
      [`GET /admin/events/${ID}`]: () => ({ status: 200, data: { event: withPhoto } }),
      [`GET /admin/events/${ID}/image?v=5`]: () => ({ status: 200, data: new Blob(['x']) }),
      [`PUT /admin/events/${ID}`]: () => ({ status: 200, data: { event: withPhoto } }),
    })
    const router = renderRoute(`/admin/eventos/${ID}/editar`)
    await screen.findByText('Uma foto antiga')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/eventos'))
    expect(calls(`PUT /admin/events/${ID}`)).toHaveLength(1)
    expect(mock.requests.filter((request) => request.url.endsWith('/image') && request.method !== 'GET')).toHaveLength(0)
    expect(JSON.stringify(calls(`PUT /admin/events/${ID}`)[0]?.body)).not.toMatch(/image|alt/i)
  })

  it('"Remover foto" only marks the removal, and the photo leaves when the event is saved; "Desfazer" cancels it', async () => {
    const user = userEvent.setup()
    openAs({
      [`GET /admin/events/${ID}`]: () => ({ status: 200, data: { event: withPhoto } }),
      [`GET /admin/events/${ID}/image?v=5`]: () => ({ status: 200, data: new Blob(['x']) }),
      [`PUT /admin/events/${ID}`]: () => ({ status: 200, data: { event: withPhoto } }),
      [`DELETE /admin/events/${ID}/image`]: () => ({ status: 200, data: { event: saved } }),
    })
    const router = renderRoute(`/admin/eventos/${ID}/editar`)
    await user.click(await screen.findByRole('button', { name: 'Remover foto' }))

    expect(screen.getByText('A foto sai do evento quando você salvar.')).toBeInTheDocument()
    expect(calls(`DELETE /admin/events/${ID}/image`)).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Desfazer' }))
    expect(screen.getByRole('button', { name: 'Remover foto' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remover foto' }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/eventos'))
    expect(calls(`DELETE /admin/events/${ID}/image`)).toHaveLength(1)
  })

  it('changing the photo of an event asks for the description and the declaration again', async () => {
    const user = userEvent.setup()
    openAs({
      [`GET /admin/events/${ID}`]: () => ({ status: 200, data: { event: withPhoto } }),
      [`GET /admin/events/${ID}/image?v=5`]: () => ({ status: 200, data: new Blob(['x']) }),
    })
    renderRoute(`/admin/eventos/${ID}/editar`)
    await user.upload(await screen.findByLabelText('Trocar foto'), photo())

    expect(await screen.findByLabelText('Descrição da foto')).toHaveValue('')
    expect(screen.getByRole('checkbox', { name: /Declaro/ })).not.toBeChecked()
  })
})
