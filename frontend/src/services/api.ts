import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15_000,
})

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown }
}
