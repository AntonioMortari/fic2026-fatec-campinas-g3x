import type { PublicFaqQuestion, PublicFaqTheme } from '../types/faq'

export const FAQ_PATH = '/perguntas-frequentes'
export const ADMIN_FAQ_PATH = '/admin/perguntas'

const plain = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function searchWords(term: string): string[] {
  return plain(term)
    .split(/\s+/)
    .filter((word) => word.length > 1)
    .slice(0, 8)
}

function matches(item: PublicFaqQuestion, words: string[]): boolean {
  const haystack = plain(`${item.question} ${item.answer}`)
  return words.every((word) => haystack.includes(word))
}

export function filterFaq(themes: PublicFaqTheme[], term: string): PublicFaqTheme[] {
  const words = searchWords(term)
  if (words.length === 0) return themes
  return themes.map((theme) => ({ ...theme, items: theme.items.filter((item) => matches(item, words)) })).filter((theme) => theme.items.length > 0)
}

export const isMissingFaq = (code: string) => ['faq_item_not_found', 'invalid_data'].includes(code)
