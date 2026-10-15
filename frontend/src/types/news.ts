export type NewsKind = 'news' | 'campaign'

export interface NewsImage {
  url: string
  alt: string
}

export interface NewsItem {
  id: string
  kind: NewsKind
  title: string
  excerpt: string
  publishedAt: string | null
  image: NewsImage | null
}

export interface NewsDetail {
  id: string
  kind: NewsKind
  title: string
  summary: string | null
  paragraphs: string[]
  publishedAt: string | null
  image: NewsImage | null
}
