import axios, { type InternalAxiosRequestConfig } from 'axios'
import { getToken, notifyUnauthorized, refreshSession } from './session'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15_000,
  withCredentials: true,
  headers: { 'X-Requested-With': 'fetch' },
})

const AUTH_ENTRY_POINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout']

type RetriableConfig = InternalAxiosRequestConfig & { retriedAfterRefresh?: boolean }

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config || !getToken()) {
      return Promise.reject(error)
    }
    const config = error.config as RetriableConfig
    const isEntryPoint = AUTH_ENTRY_POINTS.some((path) => config.url?.endsWith(path))

    // The access token is short-lived: ask for a new one with the cookie and repeat the request once.
    if (isEntryPoint || config.retriedAfterRefresh) {
      notifyUnauthorized()
      return Promise.reject(error)
    }

    const outcome = await refreshSession()
    if (outcome === 'renewed') {
      config.retriedAfterRefresh = true
      return api(config)
    }
    if (outcome === 'ended') notifyUnauthorized()
    return Promise.reject(error)
  },
)

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown }
}
