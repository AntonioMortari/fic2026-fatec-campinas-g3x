export interface GalleryPhoto {
  id: string
  alt: string
  caption: string | null
  url: string
  publishedAt: string
}

export interface GalleryAlbum {
  name: string
  photos: GalleryPhoto[]
}

export type PhotoState = 'live' | 'stored' | 'unauthorized'

export interface AdminPhoto {
  id: string
  album: string
  alt: string
  caption: string | null
  state: PhotoState
  published: boolean
  authorized: boolean
  publishedAt: string | null
  uploadedAt: string
  imageUrl: string
}

export interface PhotoUpload {
  data: string
  album: string
  alt: string
  caption: string
  authorized: boolean
}

export interface PhotoText {
  album: string
  alt: string
  caption: string
}
