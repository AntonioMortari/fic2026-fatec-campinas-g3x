import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AdminEvent, EventInput } from '../types/admin-event'
import type { RegistrationsList } from '../types/admin-registration'
import { api } from './api'

const KEY = ['admin-events']

export function useAdminEvents() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await api.get<{ data: AdminEvent[] }>('/admin/events')).data.data,
  })
}

export function useAdminEvent(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: async () => (await api.get<{ event: AdminEvent }>(`/admin/events/${id}`)).data.event,
    enabled: Boolean(id),
  })
}

function useRefreshAfterChange() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([queryClient.invalidateQueries({ queryKey: KEY }), queryClient.invalidateQueries({ queryKey: ['events'] })])
}

export function useSaveEvent(id?: string) {
  const refresh = useRefreshAfterChange()
  return useMutation({
    mutationFn: async (input: EventInput) =>
      (id ? await api.put<{ event: AdminEvent }>(`/admin/events/${id}`, input) : await api.post<{ event: AdminEvent }>('/admin/events', input)).data.event,
    onSuccess: refresh,
  })
}

export function useSetPublication() {
  const refresh = useRefreshAfterChange()
  return useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) =>
      (await api.patch<{ event: AdminEvent }>(`/admin/events/${id}/publication`, { published })).data.event,
    onSuccess: refresh,
  })
}

export function useAdminRegistrations(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id, 'registrations'],
    queryFn: async () => (await api.get<RegistrationsList>(`/admin/events/${id}/registrations`)).data,
    enabled: Boolean(id),
  })
}

export async function downloadRegistrationsCsv(id: string): Promise<void> {
  const response = await api.get<Blob>(`/admin/events/${id}/registrations.csv`, { responseType: 'blob' })
  const disposition = String(response.headers['content-disposition'] ?? '')
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'inscritos.csv'
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
