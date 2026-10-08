import { QueryClient } from '@tanstack/react-query'

/** Cache das consultas à API (React Query). */
export function criarClienteDeConsultas() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1,
      },
    },
  })
}
