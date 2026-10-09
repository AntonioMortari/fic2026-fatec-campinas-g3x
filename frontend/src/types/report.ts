export type ReportPeriod = 'month' | 'quarter' | 'semester'

export interface ReportTotals {
  activities: number | null
  registered: number | null
  attended: number | null
  missed: number | null
  unchecked: number | null
  minorsAttended: number | null
}

export interface ReportEventRow {
  id: string
  title: string
  startsAt: string
  registered: number | null
  attended: number | null
  missed: number | null
  unchecked: number | null
}

export interface Report {
  period: ReportPeriod
  offset: number
  label: string
  totals: ReportTotals
  events: ReportEventRow[]
  eventsTotal: number | null
}
