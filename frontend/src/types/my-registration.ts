export interface MyRegistration {
  id: string
  name: string
  registeredAt: string
  attendanceRecorded: boolean
  cancelCode: string
  event: { id: string; title: string; startsAt: string; endsAt: string | null; location: string | null; isOver: boolean }
}
