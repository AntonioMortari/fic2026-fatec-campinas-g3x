import { api } from './api'

// The spreadsheets are staff-only, so the browser cannot just follow a link: the request goes through Axios with the
// token and the answer is handed to the browser as a file. The name comes from the server, with a fallback.
export async function downloadFile(path: string, fallbackName: string, params?: Record<string, string | number>): Promise<void> {
  const response = await api.get<Blob>(path, { responseType: 'blob', params })
  const disposition = String(response.headers['content-disposition'] ?? '')
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? fallbackName
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
