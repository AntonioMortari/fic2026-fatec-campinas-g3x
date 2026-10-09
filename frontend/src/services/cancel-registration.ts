import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CancelPreview } from '../types/cancel-registration'
import { api } from './api'

export function useCancelPreview(code: string | null) {
  return useQuery({
    queryKey: ['cancel-registration', code],
    queryFn: async () => (await api.get<{ registration: CancelPreview }>(`/registrations/cancel/${code}`)).data.registration,
    enabled: Boolean(code),
    retry: false,
  })
}

export function useCancelRegistration(code: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.post<{ registration: CancelPreview }>(`/registrations/cancel/${code}`)).data.registration,
    // The spot is free again and the person's own list changes: both are stale the moment it is cancelled.
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        queryClient.invalidateQueries({ queryKey: ['my-registrations'] }),
        queryClient.invalidateQueries({ queryKey: ['cancel-registration', code] }),
      ]),
  })
}
