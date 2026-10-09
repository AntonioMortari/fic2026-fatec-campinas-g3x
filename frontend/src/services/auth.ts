import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from './api'

export type PersonType = 'individual' | 'organization'

export interface AuthUser {
  id: string
  name: string
  email: string
  phone: string | null
  personType: PersonType
  wantsToVolunteer: boolean
  wantsToDonate: boolean
  isStaff: boolean
}

export interface AuthResult {
  token: string
  user: AuthUser
}

export interface RegisterInput {
  name: string
  email: string
  phone: string | null
  personType: PersonType | ''
  password: string
  wantsToVolunteer: boolean
  wantsToDonate: boolean
  confirmsAdult: boolean
  consent: boolean
}

export interface LoginInput {
  email: string
  password: string
}

export function useRegister() {
  return useMutation({
    mutationFn: async (input: RegisterInput) => (await api.post<AuthResult>('/auth/register', input)).data,
  })
}

export function useLogin() {
  return useMutation({
    mutationFn: async (input: LoginInput) => (await api.post<AuthResult>('/auth/login', input)).data,
  })
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get<{ user: AuthUser }>('/auth/me')).data.user,
    retry: false,
  })
}
