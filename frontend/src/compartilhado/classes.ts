/** Junta classes do Tailwind, ignorando as vazias e condicionais falsas. */
export function classes(...lista: (string | false | null | undefined)[]): string {
  return lista.filter(Boolean).join(' ')
}
