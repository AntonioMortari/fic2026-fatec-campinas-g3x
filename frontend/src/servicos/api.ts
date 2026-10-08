import axios from 'axios'

/**
 * Cliente HTTP único da aplicação (RNF-FE-03). Toda chamada à API passa por
 * aqui; as telas não usam `fetch` nem montam URL da API por conta própria.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15_000,
})

/** Formato de erro que a API devolve em toda resposta de falha. */
export interface ErroDaApi {
  erro: { codigo: string; mensagem: string; detalhes?: unknown }
}
