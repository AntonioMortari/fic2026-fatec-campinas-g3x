import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { vi } from 'vitest'
import { api } from '../services/api'

export interface RecordedRequest {
  method: string
  url: string
  body: unknown
  authorization: string | undefined
}

type Handler = (request: RecordedRequest) => { status: number; data: unknown }

export function mockApi(handlers: Record<string, Handler>) {
  const requests: RecordedRequest[] = []
  const original = api.defaults.adapter
  if (vi.isMockFunction(api.get)) vi.mocked(api.get).mockRestore()

  const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    const method = (config.method ?? 'get').toUpperCase()
    const url = config.url ?? ''
    const request: RecordedRequest = {
      method,
      url,
      body: typeof config.data === 'string' ? JSON.parse(config.data) : config.data,
      authorization: config.headers.get('Authorization')?.toString(),
    }
    requests.push(request)
    const handler = handlers[`${method} ${url}`]
    if (!handler) throw new Error(`Unexpected request: ${method} ${url}`)
    const { status, data } = handler(request)
    const response = { data, status, statusText: String(status), headers: {}, config }
    if (status >= 200 && status < 300) return response
    throw new AxiosError(`Request failed with status ${status}`, 'ERR_BAD_REQUEST', config, null, response)
  }

  api.defaults.adapter = adapter
  return { requests, restore: () => (api.defaults.adapter = original) }
}

export const fakeUser = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Maria da Silva',
  email: 'maria@example.com',
  phone: null,
  personType: 'individual' as const,
  wantsToVolunteer: true,
  wantsToDonate: false,
  isStaff: false,
}

export const apiError = (status: number, code: string, message: string, details?: { field: string; message: string }[]) => ({
  status,
  data: { error: { code, message, details } },
})
