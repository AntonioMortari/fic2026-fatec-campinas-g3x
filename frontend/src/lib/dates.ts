export const TIME_ZONE = 'America/Sao_Paulo'

function format(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, ...options }).format(date)
}

export function dateParts(date: Date) {
  return {
    weekday: format(date, { weekday: 'short' }).replace('.', '').toLocaleUpperCase('pt-BR'),
    day: format(date, { day: '2-digit' }),
    month: format(date, { month: 'short' }).replace('.', '').toLocaleUpperCase('pt-BR'),
    spoken: format(date, { weekday: 'long', day: 'numeric', month: 'long' }),
  }
}
