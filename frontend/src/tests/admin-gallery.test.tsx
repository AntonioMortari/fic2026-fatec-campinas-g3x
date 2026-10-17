import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AdminPhoto } from '../types/gallery'
import { apiError, fakeUser, mockApi } from './auth-support'
import { renderRoute } from './render'

type Handlers = Parameters<typeof mockApi>[0]

let mock: ReturnType<typeof mockApi>
afterEach(() => {
  mock?.restore()
  vi.unstubAllGlobals()
})

const STAFF = { ...fakeUser, isStaff: true }
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3])

const entry = (overrides: Partial<AdminPhoto> = {}): AdminPhoto => ({
  id: 'ph1',
  album: 'II Festa Preta',
  alt: 'Homem de camiseta amarela toca atabaque.',
  caption: null,
  state: 'stored',
  published: false,
  authorized: true,
  publishedAt: null,
  uploadedAt: '2026-10-05T15:00:00.000Z',
  imageUrl: '/api/admin/gallery/ph1/image?v=1',
  ...overrides,
})

const KEPT = entry({ id: 'k1' })
const SEM = entry({ id: 's1', state: 'unauthorized', authorized: false, album: 'Sem autorização', alt: 'Homem de chapéu de palha.' })
const LIVE = entry({ id: 'l1', state: 'live', published: true, publishedAt: '2026-10-06T12:00:00.000Z', album: 'Cafú e o Café', alt: 'Homem sorridente deitado entre livros.' })
const ALL = [KEPT, SEM, LIVE]

function listing(photos: AdminPhoto[] = ALL): Handlers {
  return {
    'GET /admin/gallery': () => ({ status: 200, data: { data: photos } }),
    ...Object.fromEntries(photos.flatMap((photo) => [[`GET /admin/gallery/${photo.id}`, () => ({ status: 200, data: { photo } })], [`GET /admin/gallery/${photo.id}/image`, () => ({ status: 200, data: new Blob(['x']) })]])),
  }
}

function open(handlers: Handlers = listing(), { desktop = false, account = STAFF }: { desktop?: boolean; account?: typeof fakeUser } = {}) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: desktop && query.includes('64rem'),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }))
  localStorage.setItem('af-session', '1')
  mock = mockApi({ 'POST /auth/refresh': () => ({ status: 200, data: { token: 'a.b.c', user: account } }), ...handlers })
}

const calls = (key: string) => mock.requests.filter((request) => `${request.method} ${request.url}` === key)
const cards = async () => {
  await screen.findByRole('heading', { name: 'Fotos já enviadas' })
  return within(screen.getByRole('region', { name: 'Fotos já enviadas' })).getAllByRole('listitem')
}

describe('the gallery of the panel is for staff only', () => {
  it.each(['/admin/galeria', '/admin/galeria/nova', '/admin/galeria/k1/apagar', '/admin/galeria/k1/editar'])('answers the 404 of the public site on %s and asks the API for nothing', async (path) => {
    open(listing(), { account: fakeUser })
    renderRoute(path)

    expect(await screen.findByText(/Página não encontrada/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Galeria' })).not.toBeInTheDocument()
    expect(calls('GET /admin/gallery')).toHaveLength(0)
    expect(calls('GET /admin/gallery/k1')).toHaveLength(0)
  })
})

describe('the list of photos (designs 11j and 11k)', () => {
  it('opens with the title, the lead and the way to send a photo', async () => {
    open()
    renderRoute('/admin/galeria')

    expect(await screen.findByRole('heading', { level: 1, name: 'Galeria' })).toBeInTheDocument()
    expect(screen.getByText('Aqui ficam as fotos que aparecem na galeria do site.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Subir uma foto' })).toHaveAttribute('href', '/admin/galeria/nova')
  })

  it('writes each photo with its situation in words, the album and the description', async () => {
    open()
    renderRoute('/admin/galeria')

    const items = await cards()
    expect(items).toHaveLength(3)
    expect(within(items[0]!).getByText('Guardada')).toBeInTheDocument()
    expect(within(items[0]!).getByText('II Festa Preta')).toBeInTheDocument()
    expect(within(items[1]!).getByText('Sem autorização de imagem')).toBeInTheDocument()
    expect(within(items[2]!).getByText('No ar')).toBeInTheDocument()
    expect(within(items[2]!).getByText('Homem sorridente deitado entre livros.')).toBeInTheDocument()
  })

  it('offers "Publicar" on a kept photo, "Tirar do ar" on a live one, and no publishing at all on one without authorization', async () => {
    open()
    renderRoute('/admin/galeria')

    const [kept, sem, live] = await cards()
    expect(within(kept!).getByRole('button', { name: /^Publicar/ })).toBeInTheDocument()
    expect(within(live!).getByRole('button', { name: /^Tirar do ar/ })).toBeInTheDocument()
    expect(within(sem!).queryByRole('button')).not.toBeInTheDocument()
    expect(within(sem!).getByText('Não pode ir ao ar: sem autorização declarada.')).toBeInTheDocument()
  })

  it('has "Editar" and "Apagar" on every photo, as links to their own screens, even on the one without declaration', async () => {
    open()
    renderRoute('/admin/galeria')

    const items = await cards()
    expect(within(items[0]!).getByRole('link', { name: /^Apagar/ })).toHaveAttribute('href', '/admin/galeria/k1/apagar')
    expect(within(items[1]!).getByRole('link', { name: /^Apagar/ })).toHaveAttribute('href', '/admin/galeria/s1/apagar')
    expect(within(items[0]!).getByRole('link', { name: /^Editar/ })).toHaveAttribute('href', '/admin/galeria/k1/editar')
    expect(within(items[1]!).getByRole('link', { name: /^Editar/ })).toHaveAttribute('href', '/admin/galeria/s1/editar')
    expect(within(items[2]!).getByRole('link', { name: /^Editar/ })).toHaveAttribute('href', '/admin/galeria/l1/editar')
    expect(screen.getByText(/O texto de uma foto se corrige em “Editar”. Para trocar a foto em si, suba outra e apague esta/)).toBeInTheDocument()
  })

  it('draws the chips with the count of each situation and none on "Todas"', async () => {
    open()
    renderRoute('/admin/galeria')

    const group = within(await screen.findByRole('group', { name: 'Situação' }))
    await waitFor(() => expect(group.getAllByRole('button').map((button) => button.textContent)).toEqual(['Todas', 'No ar · 1', 'Guardadas · 1', 'Sem autorização · 1']))
    expect(group.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('filters by situation, keeps it in the address and goes back to everything with "Todas"', async () => {
    const user = userEvent.setup()
    open()
    const router = renderRoute('/admin/galeria')
    await cards()

    await user.click(screen.getByRole('button', { name: 'Sem autorização · 1' }))

    await waitFor(() => expect(within(screen.getByRole('region', { name: 'Fotos já enviadas' })).getAllByRole('listitem')).toHaveLength(1))
    expect(router.state.location.search).toBe('?situacao=sem-autorizacao')
    await user.click(screen.getByRole('button', { name: 'Todas' }))
    await waitFor(() => expect(within(screen.getByRole('region', { name: 'Fotos já enviadas' })).getAllByRole('listitem')).toHaveLength(3))
    expect(router.state.location.search).toBe('')
  })

  it('ignores a garbage filter in the address', async () => {
    open()
    renderRoute('/admin/galeria?situacao=zzz')

    expect(await cards()).toHaveLength(3)
  })

  it('says nothing is in that situation, and says nothing was sent yet, which are not the same', async () => {
    open(listing([KEPT]))
    renderRoute('/admin/galeria?situacao=no-ar')
    expect(await screen.findByText('Nenhuma foto nesta situação.')).toBeInTheDocument()
    expect(screen.queryByText('Nenhuma foto enviada ainda')).not.toBeInTheDocument()
    mock.restore()
    open(listing([]))
    renderRoute('/admin/galeria')
    expect(await screen.findByText('Nenhuma foto enviada ainda')).toBeInTheDocument()
  })

  it('says it is loading, says when it could not load and tries again', async () => {
    const user = userEvent.setup()
    open({ 'GET /admin/gallery': () => ({ status: 500, data: { error: { code: 'internal_error', message: 'x' } } }) })
    renderRoute('/admin/galeria')

    expect(await screen.findByText('Carregando as fotos…')).toBeInTheDocument()
    expect(await screen.findByText('Não conseguimos carregar as fotos')).toBeInTheDocument()
    mock.restore()
    open()
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByText('II Festa Preta')).toBeInTheDocument()
  })

  it('says, when the file of a photo could not be loaded, that the file may be gone and what to do', async () => {
    open({ ...listing([KEPT]), 'GET /admin/gallery/k1/image': () => ({ status: 404, data: { error: { code: 'photo_not_found', message: 'x' } } }) }, { desktop: true })
    renderRoute('/admin/galeria')

    expect(await screen.findByText(/Não deu para carregar esta foto agora/)).toBeInTheDocument()
  })

  it('explains the screen in four short lines, including the delay of "Tirar do ar" and "Apagar" for the urgent case', async () => {
    const user = userEvent.setup()
    open()
    renderRoute('/admin/galeria')
    await user.click(await screen.findByText('Como funciona esta tela'))

    expect(screen.getByText(/Nenhuma foto vai ao ar sem autorização de uso de imagem registrada/)).toBeInTheDocument()
    expect(screen.getByText('Subir não publica.')).toBeInTheDocument()
    expect(screen.getByText(/“Tirar do ar” leva alguns minutos/)).toBeInTheDocument()
    expect(screen.getByText(/Vídeo não cabe/)).toBeInTheDocument()
  })
})

describe('publishing is a separate act, confirmed in a dialog', () => {
  it('asks before putting a photo on the air, and asks the API for publication only after the answer', async () => {
    const user = userEvent.setup()
    open({ ...listing(), 'PATCH /admin/gallery/k1/publication': () => ({ status: 200, data: { photo: { ...KEPT, state: 'live', published: true } } }) })
    renderRoute('/admin/galeria')
    const [kept] = await cards()

    await user.click(within(kept!).getByRole('button', { name: /^Publicar/ }))

    const dialog = screen.getByRole('dialog', { name: 'Pôr a foto no ar?' })
    expect(within(dialog).getByText('A foto passa a aparecer na galeria, para qualquer pessoa que visite o site.')).toBeInTheDocument()
    expect(calls('PATCH /admin/gallery/k1/publication')).toHaveLength(0)
    await user.click(within(dialog).getByRole('button', { name: 'Pôr no ar' }))

    expect(await screen.findByText('Publicada. A foto já aparece na galeria do site.')).toBeInTheDocument()
    expect(calls('PATCH /admin/gallery/k1/publication')[0]?.body).toEqual({ published: true })
  })

  it('does nothing when the dialog is cancelled', async () => {
    const user = userEvent.setup()
    open()
    renderRoute('/admin/galeria')
    const [kept] = await cards()

    await user.click(within(kept!).getByRole('button', { name: /^Publicar/ }))
    await user.click(within(screen.getByRole('dialog', { name: 'Pôr a foto no ar?' })).getByRole('button', { name: 'Cancelar' }))

    expect(calls('PATCH /admin/gallery/k1/publication')).toHaveLength(0)
  })

  it('takes a photo down after the dialog, saying the copies already opened last a few minutes', async () => {
    const user = userEvent.setup()
    open({ ...listing(), 'PATCH /admin/gallery/l1/publication': () => ({ status: 200, data: { photo: { ...LIVE, state: 'stored', published: false } } }) })
    renderRoute('/admin/galeria')
    const [, , live] = await cards()

    await user.click(within(live!).getByRole('button', { name: /^Tirar do ar/ }))

    const dialog = screen.getByRole('dialog', { name: 'Tirar a foto do ar?' })
    expect(within(dialog).getByText(/por alguns minutos/)).toBeInTheDocument()
    expect(within(dialog).getByText(/use “Apagar”/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Tirar do ar' }))

    expect(await screen.findByText('Tirada do ar. A foto sumiu da galeria do site e continua guardada aqui.')).toBeInTheDocument()
    expect(calls('PATCH /admin/gallery/l1/publication')[0]?.body).toEqual({ published: false })
  })

  it('writes the reason the API gave when it refuses, in the colour of an error', async () => {
    const user = userEvent.setup()
    open({ ...listing(), 'PATCH /admin/gallery/k1/publication': () => apiError(409, 'authorization_missing', 'Esta foto não pode ir ao ar: a autorização de uso de imagem não foi declarada quando ela subiu.') })
    renderRoute('/admin/galeria')
    const [kept] = await cards()

    await user.click(within(kept!).getByRole('button', { name: /^Publicar/ }))
    await user.click(within(screen.getByRole('dialog', { name: 'Pôr a foto no ar?' })).getByRole('button', { name: 'Pôr no ar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Esta foto não pode ir ao ar')
  })
})

describe('sending a photo (designs 11j and 11l)', () => {
  const file = (name = 'IMG_2041.jpg', type = 'image/jpeg') => new File([PNG], name, { type })

  async function choose(user: ReturnType<typeof userEvent.setup>, chosen = file()) {
    await user.upload(document.querySelector<HTMLInputElement>('input[type=file]')!, chosen)
    await screen.findByText(/Escolhida:/)
  }

  const form = () => screen.getByRole('complementary', { name: 'Subir uma foto' })

  it('is its own screen on the phone, with the rule before the form', async () => {
    open()
    renderRoute('/admin/galeria/nova')

    expect(await screen.findByRole('heading', { level: 1, name: 'Subir uma foto' })).toBeInTheDocument()
    expect(screen.getByText(/Nenhuma foto vai ao ar sem autorização de uso de imagem registrada/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para Galeria' })).toHaveAttribute('href', '/admin/galeria')
    expect(screen.queryByRole('heading', { name: 'Fotos já enviadas' })).not.toBeInTheDocument()
  })

  it('is a column beside the list on the desktop', async () => {
    open(listing(), { desktop: true })
    renderRoute('/admin/galeria')

    expect(await screen.findByRole('heading', { level: 2, name: 'Subir uma foto' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Galeria' })).toBeInTheDocument()
    expect(within(form()).getByLabelText('Álbum')).toBeInTheDocument()
  })

  it('has the five fields of the design, the declaration last and the button that says what will happen', async () => {
    open()
    renderRoute('/admin/galeria/nova')

    await screen.findByRole('heading', { name: 'Subir uma foto' })
    expect(screen.getByText('Foto', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByLabelText('Álbum')).toBeInTheDocument()
    expect(screen.getByLabelText('Descrição da foto')).toBeInTheDocument()
    expect(screen.getByLabelText(/Legenda/)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Declaro que existe autorização de uso de imagem registrada/ })).not.toBeChecked()
    expect(screen.getByText('JPG, PNG, GIF ou WebP, até 4 MB. Vídeo ainda não entra por aqui.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Subir e guardar sem publicar' })).toBeInTheDocument()
  })

  it('changes the help and the button when the declaration is ticked', async () => {
    const user = userEvent.setup()
    open()
    renderRoute('/admin/galeria/nova')
    await screen.findByRole('heading', { name: 'Subir uma foto' })
    expect(screen.getByText(/Sem esta declaração a foto sobe e fica guardada, mas NÃO vai para o site/)).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: /Declaro que existe autorização/ }))

    expect(screen.getByText('Depois de subir, a foto fica guardada até você apertar “Publicar”.')).toBeInTheDocument()
    expect(screen.queryByText(/Sem esta declaração/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Subir foto' })).toBeInTheDocument()
  })

  it('shows the name and the size of the chosen photo', async () => {
    const user = userEvent.setup()
    open()
    renderRoute('/admin/galeria/nova')
    await screen.findByRole('heading', { name: 'Subir uma foto' })

    await choose(user)

    expect(screen.getByText('Escolhida: IMG_2041.jpg — 1 KB.')).toBeInTheDocument()
  })

  it('refuses a file that is not an accepted image, with words, and sends nothing', async () => {
    const user = userEvent.setup({ applyAccept: false })
    open()
    renderRoute('/admin/galeria/nova')
    await screen.findByRole('heading', { name: 'Subir uma foto' })

    await user.upload(document.querySelector<HTMLInputElement>('input[type=file]')!, new File(['x'], 'video.mp4', { type: 'video/mp4' }))

    expect(await screen.findByText('Escolha uma foto JPG, PNG, GIF ou WebP.')).toBeInTheDocument()
    expect(screen.queryByText(/Escolhida:/)).not.toBeInTheDocument()
  })

  it('refuses a GIF over 4 MB, which cannot be reduced', async () => {
    const user = userEvent.setup()
    open()
    renderRoute('/admin/galeria/nova')
    await screen.findByRole('heading', { name: 'Subir uma foto' })
    const big = new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'roda.gif', { type: 'image/gif' })

    await user.upload(document.querySelector<HTMLInputElement>('input[type=file]')!, big)

    expect(await screen.findByText('A foto passou de 4 MB e não deu para reduzir. Escolha uma menor.')).toBeInTheDocument()
  })

  it('names every missing field and sends nothing', async () => {
    const user = userEvent.setup()
    open()
    renderRoute('/admin/galeria/nova')
    await screen.findByRole('heading', { name: 'Subir uma foto' })

    await user.click(screen.getByRole('button', { name: 'Subir e guardar sem publicar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Confira os campos marcados abaixo.')
    expect(screen.getByText('Escolha uma foto para enviar.')).toBeInTheDocument()
    expect(screen.getByText('Escreva o nome do álbum.')).toBeInTheDocument()
    expect(screen.getByText('Descreva a foto para quem não a enxerga.')).toBeInTheDocument()
    expect(calls('POST /admin/gallery')).toHaveLength(0)
  })

  it('sends the photo kept, without the declaration, and goes back to the list saying it cannot go on the air', async () => {
    const user = userEvent.setup()
    open({ ...listing(), 'POST /admin/gallery': () => ({ status: 201, data: { photo: SEM } }) })
    renderRoute('/admin/galeria/nova')
    await screen.findByRole('heading', { name: 'Subir uma foto' })
    await choose(user)
    await user.type(screen.getByLabelText('Álbum'), 'II Festa Preta')
    await user.type(screen.getByLabelText('Descrição da foto'), 'Homem toca atabaque.')

    await user.click(screen.getByRole('button', { name: 'Subir e guardar sem publicar' }))

    await waitFor(() => expect(calls('POST /admin/gallery')).toHaveLength(1))
    const body = calls('POST /admin/gallery')[0]!.body as Record<string, unknown>
    expect(body).toMatchObject({ album: 'II Festa Preta', alt: 'Homem toca atabaque.', caption: null, authorized: false })
    expect(typeof body.data).toBe('string')
    expect(body).not.toHaveProperty('published')
    expect(await screen.findByRole('heading', { name: 'Galeria' })).toBeInTheDocument()
    expect(screen.getByText(/mas sem autorização de imagem: ela não pode ir para o site/)).toBeInTheDocument()
  })

  it('sends the declaration as given, and says the photo waits for "Publicar"', async () => {
    const user = userEvent.setup()
    open({ ...listing(), 'POST /admin/gallery': () => ({ status: 201, data: { photo: KEPT } }) })
    renderRoute('/admin/galeria/nova')
    await screen.findByRole('heading', { name: 'Subir uma foto' })
    await choose(user)
    await user.type(screen.getByLabelText('Álbum'), 'II Festa Preta')
    await user.type(screen.getByLabelText('Descrição da foto'), 'Homem toca atabaque.')
    await user.type(screen.getByLabelText(/Legenda/), '  Roda de tambor.  ')
    await user.click(screen.getByRole('checkbox', { name: /Declaro que existe autorização/ }))

    await user.click(screen.getByRole('button', { name: 'Subir foto' }))

    await waitFor(() => expect(calls('POST /admin/gallery')).toHaveLength(1))
    const body = calls('POST /admin/gallery')[0]!.body as Record<string, unknown>
    expect(body).toMatchObject({ caption: 'Roda de tambor.', authorized: true })
    expect(await screen.findByText('Foto enviada e guardada. Ela só vai para o site quando você apertar “Publicar”.')).toBeInTheDocument()
  })

  it('on the desktop stays on the screen, empties the form and says what happened', async () => {
    const user = userEvent.setup()
    open({ ...listing(), 'POST /admin/gallery': () => ({ status: 201, data: { photo: KEPT } }) }, { desktop: true })
    renderRoute('/admin/galeria')
    await screen.findByRole('heading', { level: 2, name: 'Subir uma foto' })
    await choose(user)
    await user.type(within(form()).getByLabelText('Álbum'), 'II Festa Preta')
    await user.type(within(form()).getByLabelText('Descrição da foto'), 'Homem toca atabaque.')

    await user.click(within(form()).getByRole('button', { name: 'Subir e guardar sem publicar' }))

    expect(await screen.findByText(/Foto enviada e guardada/)).toBeInTheDocument()
    await waitFor(() => expect(within(form()).getByLabelText('Álbum')).toHaveValue(''))
    expect(screen.queryByText(/Escolhida:/)).not.toBeInTheDocument()
  })

  it('writes the error of the API on the field it names and keeps what was typed', async () => {
    const user = userEvent.setup()
    open({ ...listing(), 'POST /admin/gallery': () => apiError(413, 'image_too_large', 'A foto passou de 4 MB. Escolha uma menor.', [{ field: 'data', message: 'A foto passou de 4 MB. Escolha uma menor.' }]) })
    renderRoute('/admin/galeria/nova')
    await screen.findByRole('heading', { name: 'Subir uma foto' })
    await choose(user)
    await user.type(screen.getByLabelText('Álbum'), 'II Festa Preta')
    await user.type(screen.getByLabelText('Descrição da foto'), 'Homem toca atabaque.')

    await user.click(screen.getByRole('button', { name: 'Subir e guardar sem publicar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Confira a foto marcada abaixo.')
    expect(screen.getAllByText('A foto passou de 4 MB. Escolha uma menor.').length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Álbum')).toHaveValue('II Festa Preta')
  })

  it('says the connection failed in words when the server cannot be reached', async () => {
    const user = userEvent.setup()
    open({ ...listing(), 'POST /admin/gallery': () => 'network-error' })
    renderRoute('/admin/galeria/nova')
    await screen.findByRole('heading', { name: 'Subir uma foto' })
    await choose(user)
    await user.type(screen.getByLabelText('Álbum'), 'A')
    await user.type(screen.getByLabelText('Descrição da foto'), 'B')

    await user.click(screen.getByRole('button', { name: 'Subir e guardar sem publicar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não conseguimos falar com o servidor')
  })
})

describe('deleting a photo (design 11m)', () => {
  it('opens on its own screen with the photo, what it is and the warning that there is no undo', async () => {
    open()
    renderRoute('/admin/galeria/s1/apagar')

    expect(await screen.findByRole('heading', { level: 1, name: 'Apagar esta foto?' })).toBeInTheDocument()
    expect(screen.getByText('Sem autorização')).toBeInTheDocument()
    expect(screen.getByText('Homem de chapéu de palha.')).toBeInTheDocument()
    expect(screen.getByText('Sem autorização de imagem · enviada em 05/10/2026')).toBeInTheDocument()
    expect(screen.getByText('Não dá para desfazer.')).toBeInTheDocument()
    expect(screen.getByText(/todo link que já circulou para de abrir/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar sem apagar' })).toHaveAttribute('href', '/admin/galeria')
  })

  it('deletes only after the red button, goes back to the list and says the file is gone', async () => {
    const user = userEvent.setup()
    open({ ...listing(), 'DELETE /admin/gallery/s1': () => ({ status: 204, data: '' }) })
    renderRoute('/admin/galeria/s1/apagar')
    await screen.findByRole('heading', { name: 'Apagar esta foto?' })
    expect(calls('DELETE /admin/gallery/s1')).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Apagar de vez' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Galeria' })).toBeInTheDocument()
    expect(screen.getByText('Apagada. A foto saiu do site e o arquivo foi removido — não dá para recuperar.')).toBeInTheDocument()
    expect(calls('DELETE /admin/gallery/s1')).toHaveLength(1)
  })

  it('says it could not delete, and stays', async () => {
    const user = userEvent.setup()
    open({ ...listing(), 'DELETE /admin/gallery/s1': () => 'network-error' })
    renderRoute('/admin/galeria/s1/apagar')
    await screen.findByRole('heading', { name: 'Apagar esta foto?' })

    await user.click(screen.getByRole('button', { name: 'Apagar de vez' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não conseguimos falar com o servidor')
    expect(screen.getByRole('heading', { name: 'Apagar esta foto?' })).toBeInTheDocument()
  })

  it('says the photo is not there, which is what the screen of an already deleted photo finds', async () => {
    open({ ...listing([]), 'GET /admin/gallery/zz': () => apiError(404, 'photo_not_found', 'Não encontramos essa foto.') })
    renderRoute('/admin/galeria/zz/apagar')

    expect(await screen.findByText('Não encontramos essa foto')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Apagar de vez' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para a galeria' })).toHaveAttribute('href', '/admin/galeria')
  })
})

describe('editing the text of a photo', () => {
  const LIVE_WITH_CAPTION = entry({ id: 'c1', state: 'live', published: true, publishedAt: '2026-10-06T12:00:00.000Z', album: 'Cafú e o Café', alt: 'Homem sorridente.', caption: 'Lançamento do livro.' })
  const field = (name: RegExp) => screen.getByRole('textbox', { name })

  it('opens on its own screen with the photo and the three texts already filled in, and says what does not change', async () => {
    open(listing([LIVE_WITH_CAPTION]))
    renderRoute('/admin/galeria/c1/editar')

    expect(await screen.findByRole('heading', { level: 1, name: 'Corrigir o texto da foto' })).toBeInTheDocument()
    expect(field(/^Álbum/)).toHaveValue('Cafú e o Café')
    expect(field(/^Descrição da foto/)).toHaveValue('Homem sorridente.')
    expect(field(/^Legenda/)).toHaveValue('Lançamento do livro.')
    expect(screen.getByText(/A foto e a autorização de imagem não mudam por aqui — só o texto/)).toBeInTheDocument()
    expect(screen.getByText(/Esta foto está no ar: o texto novo aparece no site na hora/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar sem salvar' })).toHaveAttribute('href', '/admin/galeria')
  })

  it('sends only the three texts, goes back to the list and says it was updated', async () => {
    const user = userEvent.setup()
    open({ ...listing([LIVE_WITH_CAPTION]), 'PUT /admin/gallery/c1': () => ({ status: 200, data: { photo: { ...LIVE_WITH_CAPTION, album: 'Cafú e o Café (2026)' } } }) })
    renderRoute('/admin/galeria/c1/editar')
    await screen.findByRole('heading', { name: 'Corrigir o texto da foto' })

    await user.clear(field(/^Álbum/))
    await user.type(field(/^Álbum/), 'Cafú e o Café (2026)')
    await user.clear(field(/^Legenda/))
    await user.click(screen.getByRole('button', { name: 'Salvar texto' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Galeria' })).toBeInTheDocument()
    expect(screen.getByText('Texto da foto atualizado.')).toBeInTheDocument()
    const [put] = calls('PUT /admin/gallery/c1')
    expect(put?.body).toEqual({ album: 'Cafú e o Café (2026)', alt: 'Homem sorridente.', caption: null })
  })

  it('refuses an empty album or description on the screen, marks the field and sends nothing', async () => {
    const user = userEvent.setup()
    open({ ...listing([LIVE_WITH_CAPTION]), 'PUT /admin/gallery/c1': () => ({ status: 200, data: { photo: LIVE_WITH_CAPTION } }) })
    renderRoute('/admin/galeria/c1/editar')
    await screen.findByRole('heading', { name: 'Corrigir o texto da foto' })

    await user.clear(field(/^Álbum/))
    await user.clear(field(/^Descrição da foto/))
    await user.click(screen.getByRole('button', { name: 'Salvar texto' }))

    expect(await screen.findByText('Escreva o nome do álbum.')).toBeInTheDocument()
    expect(screen.getByText('Descreva a foto para quem não a enxerga.')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Confira os campos marcados abaixo.')
    expect(field(/^Álbum/)).toBeInvalid()
    expect(calls('PUT /admin/gallery/c1')).toHaveLength(0)
  })

  it('shows what the server said and keeps what was typed', async () => {
    const user = userEvent.setup()
    open({
      ...listing([LIVE_WITH_CAPTION]),
      'PUT /admin/gallery/c1': () => apiError(400, 'invalid_data', 'Dados inválidos.', [{ field: 'alt', message: 'A descrição da foto passou de 300 caracteres.' }]),
    })
    renderRoute('/admin/galeria/c1/editar')
    await screen.findByRole('heading', { name: 'Corrigir o texto da foto' })

    await user.type(field(/^Descrição da foto/), ' mais um pouco')
    await user.click(screen.getByRole('button', { name: 'Salvar texto' }))

    expect(await screen.findByText('A descrição da foto passou de 300 caracteres.')).toBeInTheDocument()
    expect(field(/^Descrição da foto/)).toHaveValue('Homem sorridente. mais um pouco')
    expect(screen.getByRole('heading', { name: 'Corrigir o texto da foto' })).toBeInTheDocument()
  })

  it('says it could not reach the server, and stays', async () => {
    const user = userEvent.setup()
    open({ ...listing([LIVE_WITH_CAPTION]), 'PUT /admin/gallery/c1': () => 'network-error' })
    renderRoute('/admin/galeria/c1/editar')
    await screen.findByRole('heading', { name: 'Corrigir o texto da foto' })

    await user.click(screen.getByRole('button', { name: 'Salvar texto' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não conseguimos falar com o servidor')
    expect(screen.getByRole('heading', { name: 'Corrigir o texto da foto' })).toBeInTheDocument()
  })

  it('says the photo is not there when it was already deleted', async () => {
    open({ ...listing([]), 'GET /admin/gallery/zz': () => apiError(404, 'photo_not_found', 'Não encontramos essa foto.') })
    renderRoute('/admin/galeria/zz/editar')

    expect(await screen.findByText('Não encontramos essa foto')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Salvar texto' })).not.toBeInTheDocument()
  })

  describe('on the desktop the right column is the editor, with the list still in view', () => {
    const OTHER = entry({ id: 'o1', album: 'Outro álbum', alt: 'Outra descrição.' })

    it('opens the photo in the column when "Editar" is touched, marks the card and keeps the list', async () => {
      const user = userEvent.setup()
      open(listing([LIVE_WITH_CAPTION, OTHER]), { desktop: true })
      renderRoute('/admin/galeria')
      const items = await cards()
      expect(screen.getByRole('heading', { level: 2, name: 'Subir uma foto' })).toBeInTheDocument()

      await user.click(within(items[0]!).getByRole('link', { name: /^Editar/ }))

      expect(await screen.findByRole('heading', { level: 2, name: 'Corrigir o texto da foto' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Subir uma foto' })).not.toBeInTheDocument()
      expect(field(/^Álbum/)).toHaveValue('Cafú e o Café')
      expect(screen.getByRole('heading', { level: 1, name: 'Galeria' })).toBeInTheDocument()
      const list = await cards()
      expect(list).toHaveLength(2)
      expect(list[0]).toHaveAttribute('aria-current', 'true')
      expect(list[1]).not.toHaveAttribute('aria-current')
    })

    it('opens straight on the address, switches photo without leaving the screen and starts from that photo', async () => {
      const user = userEvent.setup()
      open(listing([LIVE_WITH_CAPTION, OTHER]), { desktop: true })
      renderRoute('/admin/galeria/c1/editar')
      await screen.findByRole('heading', { level: 2, name: 'Corrigir o texto da foto' })
      await user.type(field(/^Álbum/), ' rascunho')

      await user.click(within((await cards())[1]!).getByRole('link', { name: /^Editar/ }))

      await waitFor(() => expect(field(/^Álbum/)).toHaveValue('Outro álbum'))
      expect(field(/^Descrição da foto/)).toHaveValue('Outra descrição.')
    })

    it('saves in place: says it was updated, keeps the photo open and does not leave the screen', async () => {
      const user = userEvent.setup()
      open({ ...listing([LIVE_WITH_CAPTION]), 'PUT /admin/gallery/c1': () => ({ status: 200, data: { photo: { ...LIVE_WITH_CAPTION, caption: 'Nova.' } } }) }, { desktop: true })
      renderRoute('/admin/galeria/c1/editar')
      await screen.findByRole('heading', { level: 2, name: 'Corrigir o texto da foto' })

      await user.clear(field(/^Legenda/))
      await user.type(field(/^Legenda/), 'Nova.')
      await user.click(screen.getByRole('button', { name: 'Salvar texto' }))

      expect(await screen.findByText('Texto da foto atualizado.')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: 'Corrigir o texto da foto' })).toBeInTheDocument()
      expect(calls('PUT /admin/gallery/c1')[0]?.body).toEqual({ album: 'Cafú e o Café', alt: 'Homem sorridente.', caption: 'Nova.' })
    })

    it('"Cancelar" closes the editor and the column goes back to sending a photo', async () => {
      const user = userEvent.setup()
      open(listing([LIVE_WITH_CAPTION]), { desktop: true })
      renderRoute('/admin/galeria/c1/editar')
      await screen.findByRole('heading', { level: 2, name: 'Corrigir o texto da foto' })

      await user.click(screen.getByRole('link', { name: 'Cancelar' }))

      expect(await screen.findByRole('heading', { level: 2, name: 'Subir uma foto' })).toBeInTheDocument()
      expect(calls('PUT /admin/gallery/c1')).toHaveLength(0)
    })

    it('says in the column that the photo is not there, keeping the list', async () => {
      open({ ...listing([LIVE_WITH_CAPTION]), 'GET /admin/gallery/zz': () => apiError(404, 'photo_not_found', 'Não encontramos essa foto.') }, { desktop: true })
      renderRoute('/admin/galeria/zz/editar')

      expect(await screen.findByText('Não encontramos essa foto')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1, name: 'Galeria' })).toBeInTheDocument()
    })
  })
})
