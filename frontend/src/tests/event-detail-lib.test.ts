import { describeRegistration, descriptionParagraphs, whenLabel } from '../lib/event-detail'

describe('whenLabel', () => {
  it('writes weekday, day, month and the range on the São Paulo clock', () => {
    expect(whenLabel({ startsAt: '2026-10-17T17:00:00.000Z', endsAt: '2026-10-17T18:30:00.000Z' })).toBe('Sábado, 17 de outubro, das 14h às 15h30')
  })

  it('writes only the start when there is no end', () => {
    expect(whenLabel({ startsAt: '2026-10-31T22:00:00.000Z', endsAt: null })).toBe('Sábado, 31 de outubro, às 19h')
  })

  it('uses the São Paulo day even when UTC is already the next day', () => {
    expect(whenLabel({ startsAt: '2026-10-18T01:30:00.000Z', endsAt: null })).toBe('Sábado, 17 de outubro, às 22h30')
  })

  it('spells out an event that ends on another day', () => {
    expect(whenLabel({ startsAt: '2026-10-17T17:00:00.000Z', endsAt: '2026-10-18T13:00:00.000Z' })).toBe('Sábado, 17 de outubro, às 14h, até domingo, 18 de outubro, às 10h')
  })
})

describe('descriptionParagraphs', () => {
  it('splits on blank lines and line breaks, dropping empties', () => {
    expect(descriptionParagraphs('Um.\n\n  Dois.  \nTrês.\n\n')).toEqual(['Um.', 'Dois.', 'Três.'])
  })

  it('is empty without description', () => {
    expect(descriptionParagraphs(null)).toEqual([])
    expect(descriptionParagraphs('   ')).toEqual([])
  })
})

describe('describeRegistration', () => {
  it('has no spot number when the event has no limit', () => {
    expect(describeRegistration({ registrationStatus: 'open', spotsLeft: null }).spots.text).toBe('Inscrições abertas')
  })

  it('never shows a number when the count failed', () => {
    expect(describeRegistration({ registrationStatus: 'unknown', spotsLeft: null }).spots.text).toBe('Não deu para conferir agora')
  })

  it('offers no action once it started', () => {
    expect(describeRegistration({ registrationStatus: 'started', spotsLeft: null }).action).toBeNull()
  })
})
