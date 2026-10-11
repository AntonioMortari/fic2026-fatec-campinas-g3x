import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MyVolunteerApplication, VolunteerApplicationInput, VolunteerArea } from '../types/volunteering'
import { api } from './api'

const MINE_KEY = ['volunteer-applications', 'mine']

export function useVolunteerAreas(enabled = true) {
  return useQuery({
    queryKey: ['volunteer-areas'],
    enabled,
    queryFn: async () => (await api.get<{ data: VolunteerArea[] }>('/volunteer-areas')).data.data,
    staleTime: 5 * 60_000,
  })
}

export function useMyVolunteerApplications(enabled = true) {
  return useQuery({
    queryKey: MINE_KEY,
    queryFn: async () => (await api.get<{ data: MyVolunteerApplication[] }>('/me/volunteer-applications')).data.data,
    enabled,
  })
}

export function useApplyToVolunteer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: VolunteerApplicationInput) =>
      (await api.post<{ application: MyVolunteerApplication }>('/volunteer-applications', input)).data.application,
    onSuccess: (application) => queryClient.setQueryData<MyVolunteerApplication[]>(MINE_KEY, (current) => [application, ...(current ?? [])]),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['volunteer-applications'] }),
  })
}
