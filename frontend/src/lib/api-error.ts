import axios from 'axios'
import type { ApiErrorBody } from '../services/api'

export interface ParsedApiError {
  code: string
  message: string
  fields: Record<string, string>
}

function fieldsFrom(details: unknown): Record<string, string> {
  const fields: Record<string, string> = {}
  if (!Array.isArray(details)) return fields
  for (const detail of details) {
    if (typeof detail?.field === 'string' && typeof detail?.message === 'string' && !(detail.field in fields)) {
      fields[detail.field] = detail.message
    }
  }
  return fields
}

export function parseApiError(error: unknown): ParsedApiError {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data?.error
    if (body) return { code: body.code, message: body.message, fields: fieldsFrom(body.details) }
    if (!error.response) {
      return { code: 'network', message: 'Não conseguimos falar com o servidor. Confira a conexão e tente de novo.', fields: {} }
    }
  }
  return { code: 'unknown', message: 'Não foi possível concluir agora. Tente de novo em alguns minutos.', fields: {} }
}
