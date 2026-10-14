import type { NewsImage, NewsKind } from './news'

export interface AdminNews {
  id: string
  kind: NewsKind
  title: string
  summary: string | null
  body: string
  published: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  image: NewsImage | null
}

export interface NewsInput {
  kind: NewsKind
  title: string
  summary: string
  body: string
}
