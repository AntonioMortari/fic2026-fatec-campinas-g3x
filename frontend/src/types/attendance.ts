import type { AdminEvent } from './admin-event'

export interface AttendanceEntry {
  id: string
  name: string
  isMinor: boolean
  attended: boolean | null
}

export interface AttendanceList {
  event: AdminEvent
  data: AttendanceEntry[]
}
