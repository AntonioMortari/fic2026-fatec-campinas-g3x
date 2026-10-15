import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EMPTY_GALLERY } from '../lib/gallery'
import { galleryImageSrc } from '../services/gallery'
import { MENU_GROUPS, DESKTOP_MENU_GROUPS } from '../lib/navigation'
import type { GalleryAlbum } from '../types/gallery'
import { mockApi } from './auth-support'
import { renderRoute } from './render'

let mock: ReturnType<typeof mockApi>
afterEach(() => {
  mock?.restore()
  vi.unstubAllGlobals()
})

const photo = (id: string, caption: string | null = null) => ({ id, alt: `Descrição ${id}`, caption, url: `/api/gallery/${id}/image?v=1`, publishedAt: '2026-10-01T12:00:00.000Z' })
const ALBUMS: GalleryAlbum[] = [
  { name: 'II Festa Preta', photos: [photo('p1', 'Lançamento.')] },
  { name: 'Cabaça', photos: [photo('p2'), photo('p3', 'Teatro.')] },
]

const serve = (data: GalleryAlbum[] | 'fail' = ALBUMS) => {
  mock = mockApi({ 'GET /gallery': () => (data === 'fail' ? { status: 500, data: { error: { code: 'internal_error', message: 'x' } } } : { status: 200, data: { data } }) })
}

const viewer = () => screen.getByRole('dialog', { name: 'Foto em tela cheia', hidden: true })

describe('the public gallery (designs 11a and 11d)', () => {
  it('opens with the overline, the title and the lead', async () => {
    serve()
    renderRoute('/galeria')

    expect(await screen.findByRole('heading', { level: 1, name: 'Galeria' })).toBeInTheDocument()
    expect(screen.getByText('Galeria', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText('Registros das nossas ações, oficinas e apresentações.')).toBeInTheDocument()
  })

  it('draws one section per album with its name and the count, the first album first', async () => {
    serve()
    renderRoute('/galeria')

    const first = await screen.findByRole('region', { name: 'II Festa Preta' })
    expect(within(first).getByText('1 foto')).toBeInTheDocument()
    const second = screen.getByRole('region', { name: 'Cabaça' })
    expect(within(second).getByText('2 fotos')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual(['II Festa Preta', 'Cabaça'])
  })

  it('shows each photo with its description as the alternative text and the caption under it only when there is one', async () => {
    serve()
    renderRoute('/galeria')

    const second = await screen.findByRole('region', { name: 'Cabaça' })
    expect(within(second).getByRole('img', { name: 'Descrição p2' })).toBeInTheDocument()
    expect(within(second).getByRole('img', { name: 'Descrição p3' })).toBeInTheDocument()
    expect(within(second).getByText('Teatro.')).toBeInTheDocument()
    expect(within(second).queryByText('Lançamento.')).not.toBeInTheDocument()
  })

  it('makes every thumbnail a link to the image itself, so it still opens without JavaScript', async () => {
    serve()
    renderRoute('/galeria')

    const link = (await screen.findByRole('img', { name: 'Descrição p1' })).closest('a')!
    expect(link).toHaveAttribute('href', galleryImageSrc('/api/gallery/p1/image?v=1'))
  })

  it('does not link the album to a project, which the site does not have', async () => {
    serve()
    renderRoute('/galeria')

    await screen.findByRole('region', { name: 'Cabaça' })
    expect(screen.queryByText(/Conhecer o projeto/)).not.toBeInTheDocument()
  })

  it('says the albums are not ready, with the sentence about the authorization, when there is nothing', async () => {
    serve([])
    renderRoute('/galeria')

    expect(await screen.findByText(EMPTY_GALLERY)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /./ })).not.toBeInTheDocument()
  })

  it('says it is loading, and says when it could not load, and tries again', async () => {
    const user = userEvent.setup()
    serve('fail')
    renderRoute('/galeria')

    expect(screen.getByText('Carregando a galeria…')).toBeInTheDocument()
    expect(await screen.findByText('Não conseguimos carregar a galeria agora')).toBeInTheDocument()

    serve()
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByRole('region', { name: 'Cabaça' })).toBeInTheDocument()
  })

  it('is in the menus the design draws it in, and nowhere the site has no page for', () => {
    expect(MENU_GROUPS.flatMap((group) => group.items)).toContainEqual({ label: 'Galeria', to: '/galeria' })
    expect(DESKTOP_MENU_GROUPS.flatMap((group) => group.items).find((item) => item.to === '/galeria')?.label).toBe('Galeria')
  })
})

describe('the full-screen viewer (designs 11c and 11d)', () => {
  async function openFirst(user: ReturnType<typeof userEvent.setup>) {
    serve()
    renderRoute('/galeria')
    await user.click((await screen.findByRole('img', { name: 'Descrição p1' })).closest('a')!)
    return viewer()
  }

  it('opens on the photo that was touched, with the counter, the album, the caption and the two buttons', async () => {
    const user = userEvent.setup()
    const dialog = await openFirst(user)

    expect(dialog).toHaveAttribute('open')
    expect(within(dialog).getByText('1 de 3')).toBeInTheDocument()
    expect(within(dialog).getByText('II Festa Preta')).toBeInTheDocument()
    expect(within(dialog).getByText('Lançamento.')).toBeInTheDocument()
    expect(within(dialog).getByRole('img', { name: 'Descrição p1' })).toHaveAttribute('src', galleryImageSrc('/api/gallery/p1/image?v=1'))
    expect(within(dialog).getByRole('button', { name: /Anterior/ })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /Próxima/ })).toBeInTheDocument()
  })

  it('goes through every published photo, album after album, and goes round at both ends', async () => {
    const user = userEvent.setup()
    const dialog = await openFirst(user)

    await user.click(within(dialog).getByRole('button', { name: /Próxima/ }))
    expect(within(dialog).getByText('2 de 3')).toBeInTheDocument()
    expect(within(dialog).getByText('Cabaça')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: /Próxima/ }))
    await user.click(within(dialog).getByRole('button', { name: /Próxima/ }))
    expect(within(dialog).getByText('1 de 3')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: /Anterior/ }))
    expect(within(dialog).getByText('3 de 3')).toBeInTheDocument()
    expect(within(dialog).getByRole('img', { name: 'Descrição p3' })).toBeInTheDocument()
  })

  it('answers the arrow keys, and closes with the button', async () => {
    const user = userEvent.setup()
    const dialog = await openFirst(user)
    within(dialog).getByRole('button', { name: 'Fechar' }).focus()

    await user.keyboard('{ArrowRight}')
    expect(within(dialog).getByText('2 de 3')).toBeInTheDocument()
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(within(dialog).getByText('3 de 3')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Fechar' }))
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'))
  })

  it('closes with Esc, which the browser turns into the close event of the dialog', async () => {
    const user = userEvent.setup()
    const dialog = await openFirst(user)

    fireEvent(dialog, new Event('close'))

    await waitFor(() => expect(within(dialog).queryByText('1 de 3')).not.toBeInTheDocument())
  })

  it('follows a swipe to the left to the next photo, and a swipe to the right to the previous one', async () => {
    const user = userEvent.setup()
    const dialog = await openFirst(user)
    const figure = dialog.querySelector('figure')!

    fireEvent.touchStart(figure, { touches: [{ clientX: 300, clientY: 400 }] })
    fireEvent.touchEnd(figure, { changedTouches: [{ clientX: 120, clientY: 410 }] })
    expect(within(dialog).getByText('2 de 3')).toBeInTheDocument()
    fireEvent.touchStart(figure, { touches: [{ clientX: 100, clientY: 400 }] })
    fireEvent.touchEnd(figure, { changedTouches: [{ clientX: 280, clientY: 405 }] })
    expect(within(dialog).getByText('1 de 3')).toBeInTheDocument()
  })

  it('ignores a short touch and a mostly vertical one', async () => {
    const user = userEvent.setup()
    const dialog = await openFirst(user)
    const figure = dialog.querySelector('figure')!

    fireEvent.touchStart(figure, { touches: [{ clientX: 300, clientY: 400 }] })
    fireEvent.touchEnd(figure, { changedTouches: [{ clientX: 280, clientY: 400 }] })
    fireEvent.touchStart(figure, { touches: [{ clientX: 300, clientY: 100 }] })
    fireEvent.touchEnd(figure, { changedTouches: [{ clientX: 200, clientY: 500 }] })
    expect(within(dialog).getByText('1 de 3')).toBeInTheDocument()
  })

  it('leaves a modified click alone, so the image opens in a new tab as the browser does', async () => {
    serve()
    renderRoute('/galeria')
    const link = (await screen.findByRole('img', { name: 'Descrição p1' })).closest('a')!

    const proceeded = fireEvent.click(link, { ctrlKey: true })

    expect(proceeded).toBe(true)
    expect(document.querySelector('dialog[aria-label="Foto em tela cheia"]')).not.toHaveAttribute('open')
  })

  it('has no way to leave a photo behind: a single photo goes round to itself', async () => {
    const user = userEvent.setup()
    serve([{ name: 'Única', photos: [photo('only')] }])
    renderRoute('/galeria')
    await user.click((await screen.findByRole('img', { name: 'Descrição only' })).closest('a')!)
    const dialog = viewer()

    await user.click(within(dialog).getByRole('button', { name: /Próxima/ }))
    expect(within(dialog).getByText('1 de 1')).toBeInTheDocument()
  })
})
