import type { EventDetail, RegistrationStatus } from '../types/event'
import { CONTACTS } from './contacts'
import { TIME_ZONE } from './dates'
import { formatTime } from './events'

export type BadgeTone = 'ochre' | 'card' | 'muted'

export interface RegistrationView {
  badge: { label: string; tone: BadgeTone } | null
  spots: { text: string; tone: 'normal' | 'alert' | 'muted' }
  notice: { text: string; linkText: string | null; linkTo: string | null; tone: 'neutral' | 'alert'; icon: boolean } | null
  action: { kind: 'register' | 'whatsapp' | 'calendar'; label: string } | null
  showCalendar: boolean
  note: string | null
  faded: boolean
}

const WHATSAPP_LABEL = `WhatsApp ${CONTACTS.phoneDisplay}`

function spotsLine(spotsLeft: number | null): string {
  if (spotsLeft === null) return 'Inscrições abertas'
  return spotsLeft === 1 ? 'Resta 1 vaga.' : `Restam ${spotsLeft} vagas.`
}

export function describeRegistration(event: Pick<EventDetail, 'registrationStatus' | 'spotsLeft'>): RegistrationView {
  const status: RegistrationStatus = event.registrationStatus
  switch (status) {
    case 'open':
      return {
        badge: null,
        spots: { text: spotsLine(event.spotsLeft), tone: 'normal' },
        notice: null,
        action: { kind: 'register', label: 'Quero me inscrever' },
        showCalendar: true,
        note: 'Não precisa criar conta.',
        faded: false,
      }
    case 'few_left':
      return {
        badge: { label: 'Últimas vagas', tone: 'ochre' },
        spots: { text: spotsLine(event.spotsLeft), tone: 'normal' },
        notice: null,
        action: { kind: 'register', label: 'Quero me inscrever' },
        showCalendar: true,
        note: 'A vaga só fica sua quando a inscrição for enviada.',
        faded: false,
      }
    case 'full':
      return {
        badge: { label: 'Vagas esgotadas', tone: 'card' },
        spots: { text: 'Vagas esgotadas', tone: 'alert' },
        notice: {
          text: `As vagas deste evento acabaram. Dá para entrar na lista de espera falando com a gente pelo ${WHATSAPP_LABEL} — e`,
          linkText: 'a agenda tem as próximas datas.',
          linkTo: '/agenda',
          tone: 'alert',
          icon: false,
        },
        action: { kind: 'whatsapp', label: 'Lista de espera pelo WhatsApp' },
        showCalendar: true,
        note: null,
        faded: false,
      }
    case 'not_on_site':
      return {
        badge: null,
        spots: { text: 'Não precisa se inscrever', tone: 'normal' },
        notice: { text: 'Este evento não tem inscrição pelo site. É só chegar no horário.', linkText: null, linkTo: null, tone: 'neutral', icon: false },
        action: { kind: 'calendar', label: '+ Adicionar à minha agenda' },
        showCalendar: false,
        note: null,
        faded: false,
      }
    case 'started':
      return {
        badge: { label: 'Já aconteceu', tone: 'muted' },
        spots: { text: 'Inscrições encerradas', tone: 'muted' },
        notice: {
          text: 'Este evento já aconteceu, então as inscrições estão encerradas.',
          linkText: 'Veja o que vem por aí.',
          linkTo: '/agenda',
          tone: 'neutral',
          icon: false,
        },
        action: null,
        showCalendar: false,
        note: null,
        faded: true,
      }
    case 'unknown':
      return {
        badge: null,
        spots: { text: 'Não deu para conferir agora', tone: 'alert' },
        notice: {
          text: `Não deu para carregar as inscrições agora — o banco de dados não respondeu. Nada foi perdido. Tente de novo em alguns instantes, ou chame no ${WHATSAPP_LABEL} — a gente inscreve você por lá.`,
          linkText: null,
          linkTo: null,
          tone: 'alert',
          icon: true,
        },
        action: { kind: 'whatsapp', label: 'Inscrever pelo WhatsApp' },
        showCalendar: false,
        note: null,
        faded: false,
      }
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase('pt-BR') + text.slice(1)
}

function dayLabel(date: Date): string {
  const parts = new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, weekday: 'long', day: 'numeric', month: 'long' }).formatToParts(date)
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? ''
  return `${capitalize(part('weekday'))}, ${part('day')} de ${part('month')}`
}

const dayKey = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(date)

export function whenLabel(event: Pick<EventDetail, 'startsAt' | 'endsAt'>): string {
  const start = new Date(event.startsAt)
  const startTime = formatTime(event.startsAt)
  if (!event.endsAt) return `${dayLabel(start)}, às ${startTime}`
  const end = new Date(event.endsAt)
  if (dayKey(start) === dayKey(end)) return `${dayLabel(start)}, das ${startTime} às ${formatTime(event.endsAt)}`
  return `${dayLabel(start)}, às ${startTime}, até ${dayLabel(end).toLocaleLowerCase('pt-BR')}, às ${formatTime(event.endsAt)}`
}

export function descriptionParagraphs(description: string | null): string[] {
  return (description ?? '')
    .split(/\n\s*\n|\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}
