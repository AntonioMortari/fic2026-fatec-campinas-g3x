import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AdminFaq, AdminFaqItem, AdminFaqTheme, FaqItemInput } from '../types/faq'
import { api } from './api'

const KEY = ['admin-faq']

export function useAdminFaq() {
  return useQuery({ queryKey: KEY, queryFn: async () => (await api.get<AdminFaq>('/admin/faq')).data })
}

function useRefreshAfterChange() {
  const queryClient = useQueryClient()
  return () => Promise.all([queryClient.invalidateQueries({ queryKey: KEY }), queryClient.invalidateQueries({ queryKey: ['faq'] })])
}

export function useSaveFaqItem(id?: string) {
  const refresh = useRefreshAfterChange()
  return useMutation({
    mutationFn: async (input: FaqItemInput) =>
      (id ? await api.put<{ item: AdminFaqItem }>(`/admin/faq/items/${id}`, input) : await api.post<{ item: AdminFaqItem }>('/admin/faq/items', input)).data.item,
    onSuccess: refresh,
  })
}

export function useSetFaqItemPublication() {
  const refresh = useRefreshAfterChange()
  return useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => (await api.patch<{ item: AdminFaqItem }>(`/admin/faq/items/${id}/publication`, { published })).data.item,
    onSuccess: refresh,
  })
}

export function useMoveFaqItem() {
  const refresh = useRefreshAfterChange()
  return useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: 'up' | 'down' }) => (await api.patch<{ item: AdminFaqItem }>(`/admin/faq/items/${id}/position`, { direction })).data.item,
    onSuccess: refresh,
  })
}

export function useCreateFaqTheme() {
  const refresh = useRefreshAfterChange()
  return useMutation({
    mutationFn: async (name: string) => (await api.post<{ theme: AdminFaqTheme }>('/admin/faq/themes', { name })).data.theme,
    onSuccess: refresh,
  })
}

export function useRenameFaqTheme() {
  const refresh = useRefreshAfterChange()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => (await api.put<{ theme: AdminFaqTheme }>(`/admin/faq/themes/${id}`, { name })).data.theme,
    onSuccess: refresh,
  })
}

export function useSetFaqThemePublication() {
  const refresh = useRefreshAfterChange()
  return useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => (await api.patch<{ theme: AdminFaqTheme }>(`/admin/faq/themes/${id}/publication`, { published })).data.theme,
    onSuccess: refresh,
  })
}

export function useMoveFaqTheme() {
  const refresh = useRefreshAfterChange()
  return useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: 'up' | 'down' }) => (await api.patch<{ theme: AdminFaqTheme }>(`/admin/faq/themes/${id}/position`, { direction })).data.theme,
    onSuccess: refresh,
  })
}
