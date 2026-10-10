import { greeting, todayLabel } from '../lib/dates'
import { ALL_CATEGORIES, categoryOptions, eventMeta, filterByCategory, formatTimeRange, groupByMonth, isFilterUseful } from '../lib/events'
import type { EventSummary } from '../types/event'

function event(overrides: Partial<EventSummary> = {}): EventSummary {
  return {
    id: crypto.randomUUID(),
    title: 'Cafú e o Café',
    description: null,
    category: null,
    startsAt: '2026-10-17T17:00:00.000Z',
    endsAt: null,
    location: null,
    ageRange: null,
    capacity: null,
    spotsLeft: null,
    ...overrides,
  }
}

describe('formatTimeRange', () => {
  it('shows the São Paulo hour, dropping zero minutes', () => {
    expect(formatTimeRange({ startsAt: '2026-10-17T17:00:00.000Z', endsAt: null })).toBe('14h')
  })

  it('shows the range with minutes when there is an end time', () => {
    expect(formatTimeRange({ startsAt: '2026-10-17T17:00:00.000Z', endsAt: '2026-10-17T18:30:00.000Z' })).toBe('14h–15h30')
  })

  it('does not use the device time zone near midnight UTC', () => {
    expect(formatTimeRange({ startsAt: '2026-10-18T01:30:00.000Z', endsAt: null })).toBe('22h30')
  })
})

describe('eventMeta', () => {
  it('joins time, place, age range and the spots that are left, not the capacity', () => {
    const meta = eventMeta(event({ location: 'Sede, Vila Romero', ageRange: 'Livre', capacity: 18, spotsLeft: 11, endsAt: '2026-10-17T18:30:00.000Z' }))

    expect(meta).toBe('14h–15h30 · Sede, Vila Romero · Livre · 11 vagas restantes')
  })

  it('says the place is to be confirmed instead of leaving a gap', () => {
    expect(eventMeta(event())).toBe('14h · Local a confirmar')
  })

  it('uses the singular for one spot, says when none is left, and can leave it out for past events', () => {
    expect(eventMeta(event({ capacity: 5, spotsLeft: 1 }))).toContain('1 vaga restante')
    expect(eventMeta(event({ capacity: 5, spotsLeft: 1 }))).not.toContain('vagas')
    expect(eventMeta(event({ capacity: 5, spotsLeft: 0 }))).toContain('Vagas esgotadas')
    expect(eventMeta(event({ capacity: 18, spotsLeft: 9 }), { withCapacity: false })).not.toContain('vaga')
  })

  it('says nothing about spots when the event has no limit', () => {
    expect(eventMeta(event({ capacity: null, spotsLeft: null }))).not.toMatch(/vaga/i)
  })
})

describe('groupByMonth', () => {
  const now = new Date('2026-10-10T15:00:00Z')

  it('groups consecutive events of the same month, in the São Paulo calendar', () => {
    const groups = groupByMonth(
      [
        event({ startsAt: '2026-10-17T17:00:00.000Z' }),
        event({ startsAt: '2026-10-31T22:00:00.000Z' }),
        event({ startsAt: '2026-11-01T02:00:00.000Z' }),
        event({ startsAt: '2026-11-20T18:00:00.000Z' }),
      ],
      now,
    )

    expect(groups.map((group) => [group.heading, group.events.length])).toEqual([
      ['Outubro', 3],
      ['Novembro', 1],
    ])
  })

  it('adds the year when it is not the current one', () => {
    const [group] = groupByMonth([event({ startsAt: '2025-03-08T13:00:00.000Z' })], now)

    expect(group?.heading).toBe('Março de 2025')
  })
})

describe('category filter', () => {
  const events = [
    event({ category: 'Contação' }),
    event({ category: 'Oficina' }),
    event({ category: 'Contação' }),
    event({ category: null }),
  ]

  it('counts by category, biggest first, with "Todas" counting the uncategorized too', () => {
    expect(categoryOptions(events)).toEqual([
      { value: ALL_CATEGORIES, label: 'Todas', count: 4 },
      { value: 'Contação', label: 'Contação', count: 2 },
      { value: 'Oficina', label: 'Oficina', count: 1 },
    ])
  })

  it('filters by the chosen category and returns everything for "Todas"', () => {
    expect(filterByCategory(events, 'Contação')).toHaveLength(2)
    expect(filterByCategory(events, ALL_CATEGORIES)).toHaveLength(4)
  })

  it('only offers the filter when it would change the list', () => {
    const useful = (list: EventSummary[]) => isFilterUseful(categoryOptions(list), list.length)

    expect(useful(events)).toBe(true)
    expect(useful([event(), event()])).toBe(false)
    expect(useful([event({ category: 'Oficina' }), event({ category: 'Oficina' })])).toBe(false)
    expect(useful([event({ category: 'Oficina' }), event()])).toBe(true)
  })
})

describe('the greeting of the panel', () => {
  it.each([
    ['2030-11-20T12:00:00Z', 'Bom dia'],
    ['2030-11-20T14:59:00Z', 'Bom dia'],
    ['2030-11-20T15:00:00Z', 'Boa tarde'],
    ['2030-11-20T18:00:00Z', 'Boa tarde'],
    ['2030-11-20T23:30:00Z', 'Boa noite'],
  ])('at %s in São Paulo it says %s', (iso, expected) => {
    expect(greeting(new Date(iso))).toBe(expected)
  })

  it('writes the date in São Paulo, not in the device zone', () => {
    expect(todayLabel(new Date('2030-11-21T02:30:00Z')).long).toBe('Quarta-feira, 20 de novembro')
    expect(todayLabel(new Date('2030-11-21T02:30:00Z')).short).toBe('Quarta, 20 nov')
  })
})
