import type { ReportEventRow } from '../types/report'

export const DASH = '—'

export const show = (value: number | null): string => (value === null ? DASH : String(value))

const total = (rows: ReportEventRow[], key: 'registered' | 'attended' | 'missed' | 'unchecked'): number | null =>
  rows.some((row) => row[key] === null) ? null : rows.reduce((sum, row) => sum + (row[key] ?? 0), 0)

// "Total da lista": the sum of the rows on screen, and a dash as soon as one of them could not be counted.
export function listTotals(rows: ReportEventRow[]) {
  return { registered: total(rows, 'registered'), attended: total(rows, 'attended'), missed: total(rows, 'missed'), unchecked: total(rows, 'unchecked') }
}

// A share of the row, as a percentage of its sign-ups; a row that could not be counted draws no bar.
export function barShares(row: ReportEventRow): { attended: number; missed: number; unchecked: number } | null {
  const { registered, attended, missed, unchecked } = row
  if (registered === null || attended === null || missed === null || unchecked === null || registered === 0) return null
  return { attended: (attended / registered) * 100, missed: (missed / registered) * 100, unchecked: (unchecked / registered) * 100 }
}

export const PERIOD_LABELS = { month: 'Mês', quarter: 'Trimestre', semester: 'Semestre' } as const

export function listLabel(listed: number, total: number | null): string | null {
  if (total === null) return null
  return total <= listed ? `todas as ${total}` : `${listed} mais recentes de ${total}`
}
