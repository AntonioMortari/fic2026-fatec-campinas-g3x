import { describe, expect, it } from 'vitest'
import {
  NEXT_STEP,
  PERSON_STATUS_LABELS,
  STAFF_FILTER_LABELS,
  STAFF_STATUS_LABELS,
  STATUS_ORDER,
  accountSummary,
  detailDate,
  findLive,
  isLive,
  joinAreas,
  listDate,
  queueDate,
  sentOn,
  timelineDone,
} from '../lib/volunteering'
import { mine } from './volunteering-support'

const NOW = new Date('2026-10-11T15:00:00.000Z')

describe('the two vocabularies of the situation', () => {
  it('cover the same four situations and are different on purpose', () => {
    expect(Object.keys(PERSON_STATUS_LABELS).sort()).toEqual([...STATUS_ORDER].sort())
    expect(Object.keys(STAFF_STATUS_LABELS).sort()).toEqual([...STATUS_ORDER].sort())
    expect(Object.keys(STAFF_FILTER_LABELS).sort()).toEqual([...STATUS_ORDER].sort())
    expect(PERSON_STATUS_LABELS.new).toBe('Recebida, ainda sem resposta')
    expect(STAFF_STATUS_LABELS.new).toBe('Nova')
    expect(STAFF_STATUS_LABELS.volunteering).toBe('Voluntariando')
    expect(PERSON_STATUS_LABELS.volunteering).toBe('Voluntariado ativo')
    for (const status of STATUS_ORDER.filter((entry) => entry !== 'ended')) expect(PERSON_STATUS_LABELS[status]).not.toBe(STAFF_STATUS_LABELS[status])
  })

  it('has a natural next step from every situation, never to itself', () => {
    for (const status of STATUS_ORDER) expect(NEXT_STEP[status].to).not.toBe(status)
    expect(NEXT_STEP.new).toEqual({ to: 'in_contact', label: 'Marcar "em contato"' })
    expect(NEXT_STEP.volunteering.to).toBe('ended')
  })
})

describe('what counts as a live application', () => {
  it('is everything but ended: ended gives back the right to apply again', () => {
    expect(STATUS_ORDER.filter(isLive)).toEqual(['new', 'in_contact', 'volunteering'])
  })

  it('finds the live one among the ended ones, and nothing when all ended', () => {
    const live = mine({ id: 'live', status: 'in_contact' })
    expect(findLive([mine({ id: 'old', status: 'ended' }), live])).toBe(live)
    expect(findLive([mine({ status: 'ended' })])).toBeNull()
    expect(findLive([])).toBeNull()
  })

  it('advances the timeline as the situation advances', () => {
    expect(STATUS_ORDER.slice(0, 3).map(timelineDone)).toEqual([1, 2, 3])
  })
})

describe('the date of the queue', () => {
  it.each([
    ['2026-10-11T14:00:00.000Z', 'hoje'],
    ['2026-10-11T02:59:00.000Z', 'ontem'],
    ['2026-10-10T20:00:00.000Z', 'ontem'],
    ['2026-10-09T17:20:00.000Z', 'há 2 dias'],
    ['2026-10-05T17:20:00.000Z', 'há 6 dias'],
    ['2026-09-12T12:00:00.000Z', '12 set'],
    ['2026-08-03T12:00:00.000Z', '3 ago'],
    ['2025-03-10T12:00:00.000Z', 'mar 2025'],
  ])('writes %s as "%s"', (iso, words) => {
    expect(queueDate(iso, NOW)).toBe(words)
  })

  it('counts days in the zone of São Paulo, not in UTC', () => {
    expect(queueDate('2026-10-11T02:00:00.000Z', new Date('2026-10-11T04:00:00.000Z'))).toBe('ontem')
    expect(queueDate('2026-10-11T04:00:00.000Z', new Date('2026-10-11T05:00:00.000Z'))).toBe('hoje')
  })

  it('writes the day and the time of the detail in São Paulo', () => {
    expect(detailDate('2026-10-09T17:20:00.000Z')).toBe('9 out, 14:20')
    expect(detailDate('2026-10-10T02:30:00.000Z')).toBe('9 out, 23:30')
  })
})

describe('the dates the person reads', () => {
  it('writes the long date for the sentence and the short one for the list', () => {
    expect(sentOn('2026-10-09T17:20:00.000Z')).toBe('9 de outubro de 2026')
    expect(listDate('2026-10-09T17:20:00.000Z', false)).toBe('9 out 2026')
  })

  it('writes only the month and the year for an ended one', () => {
    expect(listDate('2025-03-10T12:00:00.000Z', true)).toBe('mar 2025')
  })
})

describe('the line of the account page', () => {
  it.each([
    [[mine({ status: 'new' })], '1 em análise'],
    [[mine({ status: 'in_contact' })], '1 em análise'],
    [[mine({ status: 'volunteering' })], 'Voluntariado ativo'],
    [[mine({ status: 'ended' })], '1 encerrada'],
    [[mine({ status: 'ended' }), mine({ id: 'b', status: 'ended' })], '2 encerradas'],
    [[mine({ status: 'ended' }), mine({ id: 'b', status: 'new' })], '1 em análise'],
    [[], 'Nenhuma ainda'],
  ])('describes %#', (applications, words) => {
    expect(accountSummary(applications)).toBe(words)
  })

  it('joins the areas with a middle dot', () => {
    expect(joinAreas([{ name: 'A' }, { name: 'B' }])).toBe('A · B')
    expect(joinAreas([])).toBe('')
  })
})
