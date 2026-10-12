export const MAX_PHOTO_BYTES = 4 * 1024 * 1024
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export const PHOTO_HELP = 'JPG, PNG, GIF ou WebP, até 4 MB. Aparece no topo da página do evento.'
export const UNSUPPORTED_PHOTO = 'Escolha uma foto JPG, PNG, GIF ou WebP.'
export const OVERSIZED_PHOTO = 'A foto passou de 4 MB e não deu para reduzir. Escolha uma menor.'

const LONGEST_SIDE = [2560, 1920, 1280]
const QUALITIES = [0.85, 0.7, 0.55]

export class PhotoRejected extends Error {}

async function shrink(file: File): Promise<Blob | null> {
  if (typeof createImageBitmap !== 'function') return null
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return null
  }
  try {
    for (const side of LONGEST_SIDE) {
      const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      const context = canvas.getContext('2d')
      if (!context) return null
      context.fillStyle = '#fff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      for (const quality of QUALITIES) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
        if (blob && blob.size <= MAX_PHOTO_BYTES) return blob
      }
    }
    return null
  } finally {
    bitmap.close()
  }
}

export async function preparePhoto(file: File): Promise<Blob> {
  if (!PHOTO_TYPES.includes(file.type)) throw new PhotoRejected(UNSUPPORTED_PHOTO)
  if (file.size <= MAX_PHOTO_BYTES) return file
  if (file.type === 'image/gif') throw new PhotoRejected(OVERSIZED_PHOTO)
  const smaller = await shrink(file)
  if (!smaller) throw new PhotoRejected(OVERSIZED_PHOTO)
  return smaller
}

export function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.readAsDataURL(blob)
  })
}

export interface PhotoDraft {
  blob: Blob | null
  alt: string
  authorized: boolean
  removed: boolean
}

export const EMPTY_PHOTO: PhotoDraft = { blob: null, alt: '', authorized: false, removed: false }

export const AUTHORIZATION_TEXT =
  'Declaro que existe autorização de uso de imagem registrada para todas as pessoas que aparecem nesta foto — e, no caso de crianças e adolescentes, autorização de quem é responsável por elas.'
