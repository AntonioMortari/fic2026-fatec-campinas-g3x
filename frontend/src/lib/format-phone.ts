export function formatPhone(digits: string): string {
  const match = /^(\d{2})(\d{4,5})(\d{4})$/.exec(digits)
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : digits
}
