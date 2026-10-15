export interface PublicFaqQuestion {
  id: string
  question: string
  answer: string
  link: { to: string; label: string } | null
}

export interface PublicFaqTheme {
  id: string
  name: string
  items: PublicFaqQuestion[]
}

export interface AdminFaqTheme {
  id: string
  name: string
  published: boolean
  sortOrder: number
}

export interface AdminFaqItem {
  id: string
  themeId: string
  question: string
  answer: string
  linkTo: string | null
  source: string
  published: boolean
  sortOrder: number
}

export interface AdminFaq {
  themes: AdminFaqTheme[]
  items: AdminFaqItem[]
  options: {
    links: { to: string; label: string }[]
    sources: { id: string; label: string }[]
  }
}

export interface FaqItemInput {
  question: string
  answer: string
  themeId: string
  linkTo: string | null
  source: string
}
