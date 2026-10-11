import { TIME_ZONE } from './dates'
import type { MyVolunteerApplication, VolunteerStatus } from '../types/volunteering'

export const MESSAGE_LIMIT = 2000

export const STATUS_ORDER: VolunteerStatus[] = ['new', 'in_contact', 'volunteering', 'ended']

export const PERSON_STATUS_LABELS: Record<VolunteerStatus, string> = {
  new: 'Recebida, ainda sem resposta',
  in_contact: 'A ONG está falando com você',
  volunteering: 'Voluntariado ativo',
  ended: 'Encerrada',
}

export const STAFF_STATUS_LABELS: Record<VolunteerStatus, string> = {
  new: 'Nova',
  in_contact: 'Em contato',
  volunteering: 'Voluntariando',
  ended: 'Encerrada',
}

export const STAFF_FILTER_LABELS: Record<VolunteerStatus, string> = {
  new: 'Novas',
  in_contact: 'Em contato',
  volunteering: 'Voluntariando',
  ended: 'Encerradas',
}

export const NEXT_STEP: Record<VolunteerStatus, { to: VolunteerStatus; label: string }> = {
  new: { to: 'in_contact', label: 'Marcar "em contato"' },
  in_contact: { to: 'volunteering', label: 'Marcar como voluntariando' },
  volunteering: { to: 'ended', label: 'Encerrar' },
  ended: { to: 'new', label: 'Marcar como nova' },
}

export const HOW_IT_WORKS_STEPS = [
  'Você cria uma conta e escolhe suas áreas de interesse',
  'A gente lê sua candidatura e entra em contato para conversar',
  'Combinamos juntos o que faz sentido para você e para o ateliê',
]

export const WHAT_HAPPENS_NEXT_STEPS = [
  'A candidatura fica registrada com o Ateliê e aparece em “Sua conta”',
  'A gente lê e entra em contato para conversar',
  'Combinamos juntos o que faz sentido para você e para o ateliê',
]

export const ADULT_NOTE = 'Para criar conta é preciso ter 18 anos ou mais. Crianças e adolescentes participam das atividades por inscrição feita por um responsável.'

export const APPLICATION_PATH = '/voluntariado/candidatura'

export const isLive = (status: VolunteerStatus): boolean => status !== 'ended'

export function findLive(applications: MyVolunteerApplication[]): MyVolunteerApplication | null {
  return applications.find((application) => isLive(application.status)) ?? null
}

export function timelineDone(status: VolunteerStatus): number {
  return status === 'new' ? 1 : status === 'in_contact' ? 2 : 3
}

export function joinAreas(areas: { name: string }[]): string {
  return areas.map((area) => area.name).join(' · ')
}

function format(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, ...options }).format(date)
}

const monthShort = (date: Date) => format(date, { month: 'short' }).replace('.', '')

export function sentOn(iso: string): string {
  return format(new Date(iso), { day: 'numeric', month: 'long', year: 'numeric' })
}

export function listDate(iso: string, ended: boolean): string {
  const date = new Date(iso)
  return ended ? `${monthShort(date)} ${format(date, { year: 'numeric' })}` : `${format(date, { day: 'numeric' })} ${monthShort(date)} ${format(date, { year: 'numeric' })}`
}

function dayNumber(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(date)
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  return Date.UTC(value('year'), value('month') - 1, value('day')) / 86_400_000
}

export function queueDate(iso: string, now = new Date()): string {
  const date = new Date(iso)
  const days = dayNumber(now) - dayNumber(date)
  if (days <= 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 7) return `há ${days} dias`
  if (format(date, { year: 'numeric' }) === format(now, { year: 'numeric' })) return `${format(date, { day: 'numeric' })} ${monthShort(date)}`
  return `${monthShort(date)} ${format(date, { year: 'numeric' })}`
}

export function detailDate(iso: string): string {
  const date = new Date(iso)
  return `${format(date, { day: 'numeric' })} ${monthShort(date)}, ${format(date, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}`
}

export function accountSummary(applications: MyVolunteerApplication[]): string {
  const live = findLive(applications)
  if (live?.status === 'volunteering') return 'Voluntariado ativo'
  if (live) return '1 em análise'
  const ended = applications.length
  if (ended === 0) return 'Nenhuma ainda'
  return ended === 1 ? '1 encerrada' : `${ended} encerradas`
}
