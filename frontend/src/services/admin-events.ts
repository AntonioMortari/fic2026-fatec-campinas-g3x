import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AdminEvent, EventInput } from '../types/admin-event'
import type { RegistrationsList } from '../types/admin-registration'
import type { AttendanceEntry, AttendanceList } from '../types/attendance'
import { downloadFile } from './download'
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
  await downloadFile(`/admin/events/${id}/registrations.csv`, 'inscritos.csv')
}

export function useAttendance(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id, 'attendance'],
    queryFn: async () => (await api.get<AttendanceList>(`/admin/events/${id}/attendance`)).data,
    enabled: Boolean(id),
  })
}

// The mark shows at once and goes back if the server refuses: at a door, waiting for the network between two touches
// is what makes people stop using the list.
export function useMarkAttendance(eventId: string | undefined) {
  const queryClient = useQueryClient()
  const key = [...KEY, eventId, 'attendance']
  return useMutation({
    mutationFn: async ({ registrationId, attended }: { registrationId: string; attended: boolean | null }) =>
      (await api.patch<{ registration: AttendanceEntry }>(`/admin/events/${eventId}/attendance/${registrationId}`, { attended })).data.registration,
    onMutate: async ({ registrationId, attended }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<AttendanceList>(key)
      if (previous) {
        queryClient.setQueryData<AttendanceList>(key, {
          ...previous,
          data: previous.data.map((entry) => (entry.id === registrationId ? { ...entry, attended } : entry)),
        })
      }
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [...KEY, eventId, 'registrations'] }),
        queryClient.invalidateQueries({ queryKey: ['my-registrations'] }),
      ]),
  })
}
