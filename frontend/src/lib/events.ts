import type { ChipOption } from '../components/ui/ChipFilter'
import type { EventSummary } from '../types/event'
import { TIME_ZONE } from './dates'

export const ALL_CATEGORIES = ''

function formatTime(iso: string): string {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso))
  const hour = parts.find((part) => part.type === 'hour')?.value ?? ''
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00'
  return minute === '00' ? `${hour}h` : `${hour}h${minute}`
}

export function formatTimeRange(event: Pick<EventSummary, 'startsAt' | 'endsAt'>): string {
  const start = formatTime(event.startsAt)
  return event.endsAt ? `${start}–${formatTime(event.endsAt)}` : start
}

export function spotsText(event: Pick<EventSummary, 'spotsLeft'>): string | null {
  if (event.spotsLeft === null) return null
  if (event.spotsLeft === 0) return 'Vagas esgotadas'
  return event.spotsLeft === 1 ? '1 vaga restante' : `${event.spotsLeft} vagas restantes`
}

export function eventMeta(event: EventSummary, options: { withCapacity?: boolean } = {}): string {
  const { withCapacity = true } = options
  return [formatTimeRange(event), event.location ?? 'Local a confirmar', event.ageRange, withCapacity ? spotsText(event) : null]
    .filter(Boolean)
    .join(' · ')
}

function yearAndMonth(iso: string): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, year: 'numeric', month: 'numeric' }).formatToParts(new Date(iso))
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  return { year: value('year'), month: value('month') }
}

export interface MonthGroup {
  key: string
  heading: string
  events: EventSummary[]
}

export function groupByMonth(events: EventSummary[], now: Date = new Date()): MonthGroup[] {
  const currentYear = yearAndMonth(now.toISOString()).year
  const groups: MonthGroup[] = []

  for (const event of events) {
    const { year, month } = yearAndMonth(event.startsAt)
    const key = `${year}-${String(month).padStart(2, '0')}`
    const last = groups[groups.length - 1]
    if (last?.key === key) {
      last.events.push(event)
      continue
    }
    const name = new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, month: 'long' }).format(new Date(event.startsAt))
    const capitalized = name.charAt(0).toLocaleUpperCase('pt-BR') + name.slice(1)
    groups.push({ key, heading: year === currentYear ? capitalized : `${capitalized} de ${year}`, events: [event] })
  }
  return groups
}

export function categoryOptions(events: EventSummary[]): ChipOption[] {
  const counts = new Map<string, number>()
  for (const event of events) {
    const category = event.category?.trim()
    if (category) counts.set(category, (counts.get(category) ?? 0) + 1)
  }
  const categories = [...counts.entries()]
    .sort(([nameA, countA], [nameB, countB]) => countB - countA || nameA.localeCompare(nameB, 'pt-BR'))
    .map(([value, count]) => ({ value, label: value, count }))
  return [{ value: ALL_CATEGORIES, label: 'Todas', count: events.length }, ...categories]
}

// A filter that returns the same list as "Todas" is just noise.
export function isFilterUseful(options: ChipOption[], total: number): boolean {
  const categories = options.slice(1)
  return categories.length >= 2 || (categories.length === 1 && (categories[0]?.count ?? 0) < total)
}

export function filterByCategory(events: EventSummary[], category: string): EventSummary[] {
  return category === ALL_CATEGORIES ? events : events.filter((event) => event.category?.trim() === category)
}
