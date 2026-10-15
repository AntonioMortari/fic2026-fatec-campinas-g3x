import { TIME_ZONE } from './dates'
import type { AdminPhoto, GalleryAlbum, GalleryPhoto, PhotoState } from '../types/gallery'

export const GALLERY_PATH = '/galeria'
export const ADMIN_GALLERY_PATH = '/admin/galeria'
export const ADMIN_GALLERY_NEW_PATH = '/admin/galeria/nova'

export const adminGalleryEditPath = (id: string): string => `${ADMIN_GALLERY_PATH}/${id}/editar`

export const EMPTY_GALLERY =
  'Ainda não publicamos nenhum álbum por aqui. As fotos e vídeos das nossas oficinas e apresentações só entram no ar depois da autorização de uso de imagem de quem aparece neles — assim que os primeiros álbuns estiverem prontos, você encontra os registros aqui.'

export const countLabel = (count: number): string => (count === 1 ? '1 foto' : `${count} fotos`)

export interface ViewerPhoto extends GalleryPhoto {
  album: string
}

export function flattenAlbums(albums: GalleryAlbum[]): ViewerPhoto[] {
  return albums.flatMap((album) => album.photos.map((photo) => ({ ...photo, album: album.name })))
}

export interface HomePhoto {
  id: string
  url: string
  alt: string
  album: string
}

// The home shows the photos that went on air last, whatever album they are in (design 14a: "as 5 fotos publicadas mais recentes").
export function recentPhotos(albums: GalleryAlbum[], count = 5): HomePhoto[] {
  return flattenAlbums(albums)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, count)
    .map(({ id, url, alt, album }) => ({ id, url, alt, album }))
}

// The viewer goes round: before the first photo is the last one, after the last is the first (design 11c).
export function stepIndex(index: number, step: number, total: number): number {
  return total === 0 ? 0 : (((index + step) % total) + total) % total
}

export const SWIPE_DISTANCE = 50

export function swipeStep(deltaX: number, deltaY: number): -1 | 0 | 1 {
  if (Math.abs(deltaX) < SWIPE_DISTANCE || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return 0
  return deltaX < 0 ? 1 : -1
}

export const STATE_LABELS: Record<PhotoState, string> = { live: 'No ar', stored: 'Guardada', unauthorized: 'Sem autorização de imagem' }

export const FILTER_LABELS: Record<PhotoState, string> = { live: 'No ar', stored: 'Guardadas', unauthorized: 'Sem autorização' }

export const STATE_ORDER: PhotoState[] = ['live', 'stored', 'unauthorized']

export const FILTER_SLUGS: Record<PhotoState, string> = { live: 'no-ar', stored: 'guardadas', unauthorized: 'sem-autorizacao' }

export const filterFromSlug = (slug: string | null): PhotoState | undefined => STATE_ORDER.find((state) => FILTER_SLUGS[state] === slug)

export function countByState(photos: AdminPhoto[]): Record<PhotoState, number> {
  const counts: Record<PhotoState, number> = { live: 0, stored: 0, unauthorized: 0 }
  for (const photo of photos) counts[photo.state] += 1
  return counts
}

export function numericDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso))
}

export function fileSize(bytes: number): string {
  const megabytes = bytes / (1024 * 1024)
  if (megabytes >= 0.1) return `${megabytes.toFixed(1).replace('.', ',')} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export const PHOTO_HELP = 'JPG, PNG, GIF ou WebP, até 4 MB. Vídeo ainda não entra por aqui.'
export const NO_PHOTO_CHOSEN = 'Escolha uma foto para enviar.'

export const NOTICES = {
  published: 'Publicada. A foto já aparece na galeria do site.',
  taken_down: 'Tirada do ar. A foto sumiu da galeria do site e continua guardada aqui.',
  edited: 'Texto da foto atualizado.',
  deleted: 'Apagada. A foto saiu do site e o arquivo foi removido — não dá para recuperar.',
  kept: 'Foto enviada e guardada. Ela só vai para o site quando você apertar “Publicar”.',
  kept_unauthorized:
    'Foto enviada e guardada, mas sem autorização de imagem: ela não pode ir para o site. Suba de novo com a caixa marcada, ou apague esta.',
} as const

export type NoticeKey = keyof typeof NOTICES

export const PUBLICATION_DIALOG = {
  take_down: {
    title: 'Tirar a foto do ar?',
    text: 'A foto sai da galeria do site. Quem já abriu a foto pode continuar vendo uma cópia no próprio aparelho por alguns minutos. Para o caso urgente da autorização de imagem, use “Apagar”.',
    confirm: 'Tirar do ar',
  },
  publish: {
    title: 'Pôr a foto no ar?',
    text: 'A foto passa a aparecer na galeria, para qualquer pessoa que visite o site.',
    confirm: 'Pôr no ar',
  },
} as const

export const AUTHORIZATION_DECLARATION =
  'Declaro que existe autorização de uso de imagem registrada para todas as pessoas que aparecem nesta foto — e, no caso de crianças e adolescentes, autorização de quem é responsável por elas.'

export const AUTHORIZATION_HELP = {
  declared: 'Depois de subir, a foto fica guardada até você apertar “Publicar”.',
  missing: 'Sem esta declaração a foto sobe e fica guardada, mas NÃO vai para o site. Você pode subir de novo depois, com a caixa marcada.',
} as const
