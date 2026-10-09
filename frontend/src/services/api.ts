import axios from 'axios'
import { getToken, notifyUnauthorized } from './session'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15_000,
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // Only a 401 on a request that carried a token means the session ended; a wrong password is also a 401.
    if (axios.isAxiosError(error) && error.response?.status === 401 && getToken()) notifyUnauthorized()
    return Promise.reject(error)
  },
)

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown }
}
