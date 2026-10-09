import { localToUtc } from '../src/utils/time-zone';

describe('localToUtc (the wall clock of the organization, America/Sao_Paulo)', () => {
  it('reads the time as São Paulo time, which is UTC-3 today', () => {
    expect(localToUtc('2026-11-20T15:00')?.toISOString()).toBe('2026-11-20T18:00:00.000Z');
    expect(localToUtc('2026-01-15T10:00')?.toISOString()).toBe('2026-01-15T13:00:00.000Z');
  });

  it('takes the zone from the rules, not from a fixed -03:00: in 2018 Brazil was on summer time', () => {
    expect(localToUtc('2018-12-01T12:00')?.toISOString()).toBe('2018-12-01T14:00:00.000Z');
  });

  it('crosses midnight in UTC', () => {
    expect(localToUtc('2026-11-20T22:30')?.toISOString()).toBe('2026-11-21T01:30:00.000Z');
  });

  it('can be told another zone, to show it is the zone and not the machine that decides', () => {
    expect(localToUtc('2026-11-20T15:00', 'Asia/Tokyo')?.toISOString()).toBe('2026-11-20T06:00:00.000Z');
  });

  it.each([
    ['a date that does not exist', '2026-02-30T10:00'],
    ['hour 24', '2026-11-20T24:00'],
    ['minute 60', '2026-11-20T10:60'],
    ['a space instead of T', '2026-11-20 15:00'],
    ['an explicit offset, which would contradict the rule', '2026-11-20T15:00:00Z'],
    ['seconds', '2026-11-20T15:00:30'],
    ['an empty string', ''],
    ['text', 'amanhã às três'],
  ])('refuses %s', (_label, value) => {
    expect(localToUtc(value)).toBeNull();
  });
});
