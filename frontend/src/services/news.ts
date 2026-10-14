import { useQuery } from '@tanstack/react-query'
import type { NewsDetail, NewsItem } from '../types/news'
import { api } from './api'

export function useNewsList() {
  return useQuery({ queryKey: ['news', 'list'], queryFn: async () => (await api.get<{ data: NewsItem[] }>('/news')).data.data })
}

export function useNews(id: string | undefined) {
  return useQuery({
    queryKey: ['news', 'detail', id],
    queryFn: async () => (await api.get<{ news: NewsDetail }>(`/news/${id}`)).data.news,
    enabled: Boolean(id),
    retry: false,
  })
}

export function newsImageSrc(url: string): string {
  const base = api.defaults.baseURL ?? ''
  return /^https?:\/\//.test(base) ? new URL(url, base).href : url
}
