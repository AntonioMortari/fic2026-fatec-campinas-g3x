import { useQuery } from '@tanstack/react-query'
import type { EventPeriod, EventSummary } from '../types/event'
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
