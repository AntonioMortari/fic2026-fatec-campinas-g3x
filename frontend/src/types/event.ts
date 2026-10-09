export type EventPeriod = 'upcoming' | 'past'

export interface EventSummary {
  id: string
  title: string
  description: string | null
  category: string | null
  startsAt: string
  endsAt: string | null
  location: string | null
  ageRange: string | null
  capacity: number | null
}
