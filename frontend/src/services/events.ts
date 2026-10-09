import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { EventDetail, EventPeriod, EventSummary } from '../types/event'
import { api } from './api'

async function fetchEvents(period: EventPeriod, limit?: number): Promise<EventSummary[]> {
  const { data } = await api.get<{ data: EventSummary[] }>('/events', { params: { period, limit } })
  return data.data
}

export function useEvents(period: EventPeriod) {
  return useQuery({ queryKey: ['events', period], queryFn: () => fetchEvents(period) })
}

export function useNextEvent() {
  return useQuery({
    queryKey: ['events', 'next'],
    queryFn: async () => (await fetchEvents('upcoming', 1))[0] ?? null,
  })
}

export function calendarUrl(eventId: string): string {
  return `${api.defaults.baseURL ?? ''}/events/${eventId}/calendar.ics`
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ['events', 'detail', id],
    queryFn: async () => (await api.get<{ event: EventDetail }>(`/events/${id}`)).data.event,
    enabled: Boolean(id),
    retry: false,
  })
}

export interface RegistrationInput {
  name: string
  email: string
  phone: string
  cpf: string
  isMinor: boolean
  guardianName: string
  guardianPhone: string
  imageAuthorized: boolean
  consent: boolean
}

export function useEventRegistration(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: RegistrationInput) =>
      (await api.post<{ registration: { id: string; name: string }; event: EventSummary }>(`/events/${eventId}/registrations`, input)).data,
    // The agenda and the home show the spots left: they are stale the moment someone signs up.
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })
}
