import type { EventSummary } from './event'

export interface AdminEvent extends EventSummary {
  requiresCpf: boolean
  published: boolean
  registrationCount: number
  updatedAt: string
}

export interface EventInput {
  title: string
  description: string | null
  category: string | null
  startsAt: string
  endsAt: string | null
  location: string | null
  ageRange: string | null
  capacity: number | string | null
  requiresCpf: boolean
}
