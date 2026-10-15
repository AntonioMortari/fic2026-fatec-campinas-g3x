import { TIME_ZONE } from './dates'
import { parseApiError } from './api-error'
import type { NewsKind } from '../types/news'

export const KIND_LABELS: Record<NewsKind, string> = { news: 'Notícia', campaign: 'Campanha' }

function format(iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, ...options }).format(new Date(iso))
}

// "11 de outubro de 2026"
export function longDate(iso: string): string {
  return format(iso, { day: 'numeric', month: 'long', year: 'numeric' })
}

// "10/10/2026"
export function numericDate(iso: string): string {
  return format(iso, { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// A route the API does not have also answers 404 ("not_found"): only an unknown piece is a missing page for the person.
// An id that is not even a UUID is rejected by validation (400 "invalid_data"), and for the person it is the same missing page.
export const isMissingNews = (error: unknown) => ['news_not_found', 'invalid_data'].includes(parseApiError(error).code)

export const NEWS_PATH = '/noticias'
export const ADMIN_NEWS_PATH = '/admin/noticias'
