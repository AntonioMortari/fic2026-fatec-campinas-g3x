export type EventPeriod = 'upcoming' | 'past'

export type RegistrationStatus = 'open' | 'few_left' | 'full' | 'not_on_site' | 'started' | 'unknown'

export interface EventImage {
  url: string
  alt: string
}

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
  spotsLeft: number | null
  registrationOnSite: boolean
  registrationStatus: RegistrationStatus
  image: EventImage | null
}

export interface EventDetail extends EventSummary {
  requiresCpf: boolean
  registrationsOpen: boolean
}
