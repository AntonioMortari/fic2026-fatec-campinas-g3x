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

// The value a <input type="datetime-local"> understands, read in the organization's zone and not the device's.
export function toLocalInput(iso: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(iso))
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${value('year')}-${value('month')}-${value('day')}T${value('hour')}:${value('minute')}`
}
