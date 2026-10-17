import { useQuery } from '@tanstack/react-query'
import type { PublicFaqTheme } from '../types/faq'
import { api } from './api'

export function usePublicFaq() {
  return useQuery({ queryKey: ['faq'], queryFn: async () => (await api.get<{ data: PublicFaqTheme[] }>('/faq')).data.data })
}
