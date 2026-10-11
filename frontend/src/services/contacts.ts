import { useMutation } from '@tanstack/react-query'
import { api } from './api'

export interface ContactInput {
  name: string
  email: string
  phone: string
  institution: string
  message: string
  consent: boolean
}

export function useSendContact() {
  return useMutation({
    mutationFn: async (input: ContactInput) => (await api.post<{ received: true }>('/contacts', input)).data,
  })
}
