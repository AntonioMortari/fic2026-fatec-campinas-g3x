import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AdminVolunteerApplication, AdminVolunteerList, StatusCounts, VolunteerFilters, VolunteerStatus } from '../types/volunteering'
import { api } from './api'
import { downloadFile } from './download'

const KEY = ['admin-volunteers']

function params(filters: VolunteerFilters): Record<string, string> {
  return { ...(filters.status ? { status: filters.status } : {}), ...(filters.area ? { area: filters.area } : {}) }
}

export function useAdminVolunteers(filters: VolunteerFilters) {
  return useQuery({
    queryKey: [...KEY, 'list', filters.status ?? null, filters.area ?? null],
    queryFn: async () => (await api.get<AdminVolunteerList>('/admin/volunteer-applications', { params: params(filters) })).data,
  })
}

export function useAdminVolunteer(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, 'detail', id],
    queryFn: async () => (await api.get<{ application: AdminVolunteerApplication }>(`/admin/volunteer-applications/${id}`)).data.application,
    enabled: Boolean(id),
    retry: false,
  })
}

export function useVolunteerCounts(enabled = true) {
  return useQuery({
    queryKey: [...KEY, 'counts'],
    queryFn: async () => (await api.get<{ counts: StatusCounts }>('/admin/volunteer-applications/counts')).data.counts,
    enabled,
    staleTime: 30_000,
  })
}

export function useSetVolunteerStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: VolunteerStatus }) =>
      (await api.patch<{ application: AdminVolunteerApplication }>(`/admin/volunteer-applications/${id}/status`, { status })).data.application,
    onSuccess: (application) => queryClient.setQueryData([...KEY, 'detail', application.id], application),
    onSettled: () => Promise.all([queryClient.invalidateQueries({ queryKey: KEY }), queryClient.invalidateQueries({ queryKey: ['volunteer-applications'] })]),
  })
}

export async function downloadVolunteersCsv(filters: VolunteerFilters): Promise<void> {
  await downloadFile('/admin/volunteer-applications/export.csv', 'voluntarios.csv', params(filters))
}
