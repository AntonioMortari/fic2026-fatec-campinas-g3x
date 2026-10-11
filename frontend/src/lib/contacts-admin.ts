import type { AdminContact, ContactStatus } from '../types/contacts'
import { detailDate, queueDate } from './volunteering'

export { detailDate, queueDate }

export const CONTACT_STATUS_ORDER: ContactStatus[] = ['new', 'in_contact', 'done']

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  new: 'Nova',
  in_contact: 'Em contato',
  done: 'Concluída',
}

export const CONTACT_FILTER_LABELS: Record<ContactStatus, string> = {
  new: 'Novas',
  in_contact: 'Em contato',
  done: 'Concluídas',
}

export const NEXT_CONTACT_STEP: Record<ContactStatus, { to: ContactStatus; label: string; short: string }> = {
  new: { to: 'in_contact', label: 'Marcar "em contato"', short: 'Em contato' },
  in_contact: { to: 'done', label: 'Marcar "concluída"', short: 'Concluída' },
  done: { to: 'in_contact', label: 'Reabrir', short: 'Reabrir' },
}

export const STAFF_NOTE_LIMIT = 2000

export const CONTACTS_PATH = '/admin/contatos'

export const contactTitle = (contact: Pick<AdminContact, 'institution' | 'name'>): string => contact.institution ?? contact.name

export const isOpen = (status: ContactStatus): boolean => status !== 'done'

export function previewOf(message: string): string {
  return message.replace(/\s+/g, ' ').trim()
}

export const whatsappLink = (phone: string): string => `https://wa.me/55${phone}`

export function parsePage(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 ? page : 1
}
