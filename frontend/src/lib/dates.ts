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

// "sáb 18/10": short enough for a list line.
export function shortDate(iso: string): string {
  const date = new Date(iso)
  const weekday = format(date, { weekday: 'short' }).replace('.', '')
  return `${weekday} ${format(date, { day: '2-digit', month: '2-digit' })}`
}

export function greeting(now = new Date()): string {
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hour: 'numeric', hourCycle: 'h23' }).format(now))
  return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
}

// "Quinta, 9 de outubro" on the desktop, "Quinta, 9 out" on the phone.
export function todayLabel(now = new Date()): { long: string; short: string } {
  const weekday = format(now, { weekday: 'long' })
  const capital = weekday.charAt(0).toLocaleUpperCase('pt-BR') + weekday.slice(1)
  const day = format(now, { day: 'numeric' })
  return { long: `${capital}, ${day} de ${format(now, { month: 'long' })}`, short: `${capital.replace(/-feira$/, '')}, ${day} ${format(now, { month: 'short' }).replace('.', '')}` }
}
