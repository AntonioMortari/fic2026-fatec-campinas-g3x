export type VolunteerStatus = 'new' | 'in_contact' | 'volunteering' | 'ended'

export interface VolunteerArea {
  id: string
  name: string
  description: string
}

export interface ApplicationArea {
  id: string
  name: string
}

export interface MyVolunteerApplication {
  id: string
  status: VolunteerStatus
  message: string | null
  createdAt: string
  areas: ApplicationArea[]
}

export interface AdminVolunteerApplication extends MyVolunteerApplication {
  updatedAt: string
  name: string
  email: string
  phone: string | null
}

export type StatusCounts = Record<VolunteerStatus, number> & { all: number }

export interface VolunteerFilters {
  status?: VolunteerStatus
  area?: string
}

export interface AdminVolunteerList {
  data: AdminVolunteerApplication[]
  counts: StatusCounts
}

export interface VolunteerApplicationInput {
  areas: string[]
  message: string
}
