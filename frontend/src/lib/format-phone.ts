export function formatPhone(digits: string): string {
  const match = /^(\d{2})(\d{4,5})(\d{4})$/.exec(digits)
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : digits
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length === 0 ? '' : `(${digits}`
  const split = digits.length > 10 ? 7 : 6
  const head = `(${digits.slice(0, 2)}) ${digits.slice(2, split)}`
  return digits.length > split ? `${head}-${digits.slice(split)}` : head
}

export function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
}
