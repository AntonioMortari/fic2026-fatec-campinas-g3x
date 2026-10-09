import { reportRange } from '../src/utils/report-period';

const at = (iso: string) => new Date(iso);

describe('reportRange', () => {
  const NOW = at('2026-09-15T15:00:00Z');

  it('a month: from the first midnight in São Paulo to the first midnight of the next one, with the name of the month', () => {
    const range = reportRange('month', 0, NOW);

    expect(range.from.toISOString()).toBe('2026-09-01T03:00:00.000Z');
    expect(range.to.toISOString()).toBe('2026-10-01T03:00:00.000Z');
    expect(range.label).toBe('Setembro de 2026');
  });

  it('a quarter and a semester end in the current month', () => {
    expect(reportRange('quarter', 0, NOW)).toMatchObject({ label: 'Jul–Set 2026', from: at('2026-07-01T03:00:00Z'), to: at('2026-10-01T03:00:00Z') });
    expect(reportRange('semester', 0, NOW)).toMatchObject({ label: 'Abr–Set 2026', from: at('2026-04-01T03:00:00Z'), to: at('2026-10-01T03:00:00Z') });
  });

  it('the previous window is the one right before, with no gap and no overlap', () => {
    const current = reportRange('quarter', 0, NOW);
    const previous = reportRange('quarter', -1, NOW);

    expect(previous.to.getTime()).toBe(current.from.getTime());
    expect(previous.label).toBe('Abr–Jun 2026');
    expect(reportRange('month', -1, NOW).label).toBe('Agosto de 2026');
  });

  it('crosses the year, in the label and in the dates', () => {
    const range = reportRange('quarter', 0, at('2026-02-10T15:00:00Z'));

    expect(range.label).toBe('Dez 2025–Fev 2026');
    expect(range.from.toISOString()).toBe('2025-12-01T03:00:00.000Z');
    expect(reportRange('month', -2, at('2026-02-10T15:00:00Z')).label).toBe('Dezembro de 2025');
  });

  it('reads the month on the wall clock of São Paulo, not in UTC', () => {
    // 01:30 UTC on October 1st is still the night of September 30th in São Paulo.
    expect(reportRange('month', 0, at('2026-10-01T01:30:00Z')).label).toBe('Setembro de 2026');
    expect(reportRange('month', 0, at('2026-10-01T03:30:00Z')).label).toBe('Outubro de 2026');
  });

  it('follows the time zone offset of each season (the offset was not always -03:00)', () => {
    // Brazil kept daylight saving time until February 2019: on December 1st 2018 the offset was -02:00.
    expect(reportRange('month', 0, at('2018-12-15T15:00:00Z')).from.toISOString()).toBe('2018-12-01T02:00:00.000Z');
    expect(reportRange('month', 0, at('2018-12-15T15:00:00Z')).to.toISOString()).toBe('2019-01-01T02:00:00.000Z');
  });
});
