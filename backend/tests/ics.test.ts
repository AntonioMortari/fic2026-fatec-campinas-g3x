import { buildIcs, escapeText, foldLine, icsFileName } from '../src/utils/ics';

const EVENT = {
  id: '3b3a6c52-6b0e-4d0b-9c58-1d2a5f1c9a10',
  title: 'Cafú e o Café',
  description: 'Uma viagem às fazendas de café, em linguagem acessível.',
  location: 'Sede, Vila Romero',
  startsAt: new Date('2026-10-17T17:00:00Z'),
  endsAt: new Date('2026-10-17T18:30:00Z'),
};

const NOW = new Date('2026-10-01T12:00:00Z');

describe('ics', () => {
  it('writes a valid calendar with UTC times and CRLF line endings', () => {
    const ics = buildIcs(EVENT, NOW);

    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('DTSTART:20261017T170000Z');
    expect(ics).toContain('DTEND:20261017T183000Z');
    expect(ics).toContain('DTSTAMP:20261001T120000Z');
    expect(ics).toContain(`UID:${EVENT.id}@atelieafrocultural.site`);
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
  });

  it('ends two hours after the start when the event has no end time', () => {
    const ics = buildIcs({ ...EVENT, endsAt: null }, NOW);

    expect(ics).toContain('DTEND:20261017T190000Z');
  });

  it('omits description and location when they are missing', () => {
    const ics = buildIcs({ ...EVENT, description: null, location: null }, NOW);

    expect(ics).not.toContain('DESCRIPTION');
    expect(ics).not.toContain('LOCATION');
  });

  it('escapes the characters that would break a property', () => {
    expect(escapeText('a, b; c\\d\ne')).toBe('a\\, b\; c\\\\d\\ne');
  });

  it('cannot be tricked into starting a new property through a line break in the title', () => {
    const ics = buildIcs({ ...EVENT, title: 'Oficina\r\nATTENDEE:mailto:x@example.com' }, NOW);

    expect(ics).not.toContain('\r\nATTENDEE');
  });

  it('folds long lines at 75 octets without splitting a multibyte character', () => {
    const folded = foldLine(`SUMMARY:${'ã'.repeat(60)}`);

    for (const line of folded.split('\r\n')) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
    expect(folded.replace(/\r\n /g, '')).toBe(`SUMMARY:${'ã'.repeat(60)}`);
  });

  it('builds a safe ASCII file name from the title', () => {
    expect(icsFileName('Cafú e o Café')).toBe('cafu-e-o-cafe.ics');
    expect(icsFileName('???')).toBe('event.ics');
  });
});
