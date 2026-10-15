import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AdminNews, NewsInput } from '../types/admin-news'
import { api } from './api'

const KEY = ['admin-news']

export function useAdminNewsList() {
  return useQuery({ queryKey: KEY, queryFn: async () => (await api.get<{ data: AdminNews[] }>('/admin/news')).data.data })
}

export function useAdminNews(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: async () => (await api.get<{ news: AdminNews }>(`/admin/news/${id}`)).data.news,
    enabled: Boolean(id),
    retry: false,
  })
}

function useRefreshAfterChange() {
  const queryClient = useQueryClient()
  return () => Promise.all([queryClient.invalidateQueries({ queryKey: KEY }), queryClient.invalidateQueries({ queryKey: ['news'] })])
}

export function useSaveNews(id?: string) {
  const refresh = useRefreshAfterChange()
  return useMutation({
    mutationFn: async (input: NewsInput) =>
      (id ? await api.put<{ news: AdminNews }>(`/admin/news/${id}`, input) : await api.post<{ news: AdminNews }>('/admin/news', input)).data.news,
    onSuccess: refresh,
  })
}

export function useSetNewsPublication() {
  const refresh = useRefreshAfterChange()
  return useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) =>
      (await api.patch<{ news: AdminNews }>(`/admin/news/${id}/publication`, { published })).data.news,
    onSuccess: refresh,
  })
}

// The panel's images are behind the session, so they are fetched with the token and shown from a blob.
export function useAdminNewsImage(url: string | undefined) {
  return useQuery({
    queryKey: [...KEY, 'image', url],
    queryFn: async () => (await api.get<Blob>(String(url).replace(/^\/api/, ''), { responseType: 'blob' })).data,
    enabled: Boolean(url),
    staleTime: Infinity,
    retry: false,
  })
}

export function useSetNewsImage() {
  const refresh = useRefreshAfterChange()
  return useMutation({
    mutationFn: async ({ id, data, alt }: { id: string; data: string; alt: string }) =>
      (await api.put<{ news: AdminNews }>(`/admin/news/${id}/image`, { data, alt, authorized: true })).data.news,
    onSuccess: refresh,
  })
}

export function useRemoveNewsImage() {
  const refresh = useRefreshAfterChange()
  return useMutation({
    mutationFn: async (id: string) => (await api.delete<{ news: AdminNews }>(`/admin/news/${id}/image`)).data.news,
    onSuccess: refresh,
  })
}
