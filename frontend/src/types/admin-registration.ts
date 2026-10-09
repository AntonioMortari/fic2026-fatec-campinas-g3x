import type { AdminEvent } from './admin-event'

export interface AdminRegistration {
  id: string
  name: string
  email: string
  phone: string | null
  cpf: string | null
  isMinor: boolean
  guardianName: string | null
  guardianPhone: string | null
  imageAuthorized: boolean
  hasAccount: boolean
  createdAt: string
}

export interface RegistrationsList {
  event: AdminEvent
  data: AdminRegistration[]
}
