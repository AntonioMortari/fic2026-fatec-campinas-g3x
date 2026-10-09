import type { AttendanceEntry } from '../types/attendance'

export const plain = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR')

function abbreviate(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1] : ''
  return last ? `${first} ${last.charAt(0).toLocaleUpperCase('pt-BR')}.` : first
}

// "Ana S." for a screen turned toward a queue; two people that would read the same keep the whole name.
export function displayNames(entries: AttendanceEntry[]): Map<string, string> {
  const counts = new Map<string, number>()
  for (const entry of entries) {
    const short = plain(abbreviate(entry.name))
    counts.set(short, (counts.get(short) ?? 0) + 1)
  }
  return new Map(entries.map((entry) => [entry.id, (counts.get(plain(abbreviate(entry.name))) ?? 0) > 1 ? entry.name : abbreviate(entry.name)]))
}
