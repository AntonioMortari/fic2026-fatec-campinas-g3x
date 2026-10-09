import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { Report, ReportPeriod } from '../types/report'
import { api } from './api'
import { downloadFile } from './download'

export function useReport(period: ReportPeriod, offset: number) {
  return useQuery({
    queryKey: ['admin-report', period, offset],
    queryFn: async () => (await api.get<Report>('/admin/report', { params: { period, offset } })).data,
    // Switching the period keeps the old numbers on screen until the new ones arrive, instead of flashing a loading state.
    placeholderData: keepPreviousData,
  })
}

export function downloadReportCsv(period: ReportPeriod, offset: number): Promise<void> {
  return downloadFile('/admin/report/csv', 'relatorio.csv', { period, offset })
}
