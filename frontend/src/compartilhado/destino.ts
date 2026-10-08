/**
 * Valida o `?voltar=` antes de usá-lo como destino. É entrada de quem monta
 * o link, então é uma lista do que é permitido, e não uma tentativa de
 * reconhecer o perigoso: só caminho interno, em segmentos de letras
 * minúsculas, dígitos e hífen. `//outro-site`, `https:`, `\`, `?`, `#` e `%`
 * ficam de fora — o que fecha o redirecionamento aberto.
 *
 * Mesma regra do projeto de origem (compartilhado/destino-apos-entrar.ts).
 */
const CAMINHO_PERMITIDO = /^\/[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\/[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)*$/

const TAMANHO_MAXIMO = 120

/** Laço (voltar para entrar) e telas de token de uso único. */
const FORA_DA_LISTA = ['/entrar', '/recuperar-acesso', '/nova-senha', '/auth']

export function destinoSeguro(valor: string | null | undefined, padrao = '/'): string {
  if (!valor || valor.length > TAMANHO_MAXIMO || !CAMINHO_PERMITIDO.test(valor)) return padrao
  const naLista = FORA_DA_LISTA.some((rota) => valor === rota || valor.startsWith(`${rota}/`))
  return naLista ? padrao : valor
}
