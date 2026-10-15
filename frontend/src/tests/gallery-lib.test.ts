import { describe, expect, it } from 'vitest'
import {
  ADMIN_GALLERY_NEW_PATH,
  ADMIN_GALLERY_PATH,
  countByState,
  countLabel,
  fileSize,
  filterFromSlug,
  FILTER_SLUGS,
  flattenAlbums,
  numericDate,
  STATE_ORDER,
  stepIndex,
  swipeStep,
} from '../lib/gallery'
import type { AdminPhoto, GalleryAlbum } from '../types/gallery'

const album = (name: string, ids: string[]): GalleryAlbum => ({ name, photos: ids.map((id) => ({ id, alt: `alt ${id}`, caption: null, url: `/api/gallery/${id}/image` })) })

describe('the gallery helpers', () => {
  it('counts photos with the singular the design uses', () => {
    expect(countLabel(1)).toBe('1 foto')
    expect(countLabel(2)).toBe('2 fotos')
    expect(countLabel(0)).toBe('0 fotos')
  })

  it('flattens the albums in order, keeping each photo with the name of its album', () => {
    const flat = flattenAlbums([album('B', ['b1']), album('A', ['a1', 'a2'])])
    expect(flat.map((photo) => `${photo.album}:${photo.id}`)).toEqual(['B:b1', 'A:a1', 'A:a2'])
  })

  it('goes round in the viewer: before the first is the last, after the last is the first', () => {
    expect(stepIndex(0, -1, 3)).toBe(2)
    expect(stepIndex(2, 1, 3)).toBe(0)
    expect(stepIndex(1, 1, 3)).toBe(2)
    expect(stepIndex(0, 1, 1)).toBe(0)
    expect(stepIndex(0, 1, 0)).toBe(0)
  })

  it('reads a swipe only when it is long enough and more sideways than up and down', () => {
    expect(swipeStep(-80, 5)).toBe(1)
    expect(swipeStep(80, -5)).toBe(-1)
    expect(swipeStep(-30, 0)).toBe(0)
    expect(swipeStep(-80, 70)).toBe(0)
  })

  it('writes sizes in MB with a comma, and small ones in KB', () => {
    expect(fileSize(2.8 * 1024 * 1024)).toBe('2,8 MB')
    expect(fileSize(98 * 1024)).toBe('98 KB')
    expect(fileSize(10)).toBe('1 KB')
  })

  it('writes the date in the numeric form of the panel, in the zone of São Paulo', () => {
    expect(numericDate('2026-10-05T02:00:00.000Z')).toBe('04/10/2026')
  })

  it('counts the photos of each situation', () => {
    const photo = (state: AdminPhoto['state']) => ({ state }) as AdminPhoto
    expect(countByState([photo('live'), photo('stored'), photo('stored'), photo('unauthorized')])).toEqual({ live: 1, stored: 2, unauthorized: 1 })
  })

  it('maps each filter to an address word and back, and ignores anything else', () => {
    for (const state of STATE_ORDER) expect(filterFromSlug(FILTER_SLUGS[state])).toBe(state)
    expect(filterFromSlug('zzz')).toBeUndefined()
    expect(filterFromSlug(null)).toBeUndefined()
  })

  it('keeps the new-photo screen inside the gallery of the panel', () => {
    expect(ADMIN_GALLERY_NEW_PATH.startsWith(`${ADMIN_GALLERY_PATH}/`)).toBe(true)
  })
})
