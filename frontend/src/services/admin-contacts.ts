import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AdminContact, AdminContactList, ContactCounts, ContactFilters, ContactTriage } from '../types/contacts'
import { api } from './api'
import { downloadFile } from './download'

const KEY = ['admin-contacts']

export function useAdminContacts(filters: ContactFilters) {
  const page = filters.page ?? 1
  return useQuery({
    queryKey: [...KEY, 'list', filters.status ?? null, page],
    queryFn: async () => (await api.get<AdminContactList>('/admin/contacts', { params: { ...(filters.status ? { status: filters.status } : {}), page } })).data,
    placeholderData: keepPreviousData,
  })
}

export function useAdminContact(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, 'detail', id],
    queryFn: async () => (await api.get<{ contact: AdminContact }>(`/admin/contacts/${id}`)).data.contact,
    enabled: Boolean(id),
    retry: false,
  })
}

export function useContactCounts(enabled = true) {
  return useQuery({
    queryKey: [...KEY, 'counts'],
    queryFn: async () => (await api.get<{ counts: ContactCounts }>('/admin/contacts/counts')).data.counts,
    enabled,
    staleTime: 30_000,
  })
}

export function useTriageContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...changes }: ContactTriage & { id: string }) => (await api.patch<{ contact: AdminContact }>(`/admin/contacts/${id}`, changes)).data.contact,
    onSuccess: (contact) => queryClient.setQueryData([...KEY, 'detail', contact.id], contact),
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export async function downloadContactsCsv(filters: ContactFilters): Promise<void> {
  await downloadFile('/admin/contacts/export.csv', 'mensagens.csv', filters.status ? { status: filters.status } : undefined)
}
