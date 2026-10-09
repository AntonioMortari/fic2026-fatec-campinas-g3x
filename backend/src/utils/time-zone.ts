export const ORGANIZATION_TIME_ZONE = 'America/Sao_Paulo';

const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function wallClockAsUtc(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instant));
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return Date.UTC(value('year'), value('month') - 1, value('day'), value('hour'), value('minute'), value('second'));
}

// Reads "2026-11-20T15:00" as the wall clock of the organization, whatever the device or the server clock says.
export function localToUtc(value: string, timeZone: string = ORGANIZATION_TIME_ZONE): Date | null {
  const match = LOCAL_DATE_TIME.exec(value);
  if (!match) return null;

  const [year, month, day, hour, minute] = match.slice(1).map(Number) as [number, number, number, number, number];
  const naive = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const isRealDate =
    naive.getUTCFullYear() === year && naive.getUTCMonth() === month - 1 && naive.getUTCDate() === day && hour <= 23 && minute <= 59;
  if (!isRealDate) return null;

  // Two passes: the offset found for the naive instant may differ from the one at the real instant.
  let instant = naive.getTime() - (wallClockAsUtc(naive.getTime(), timeZone) - naive.getTime());
  instant = naive.getTime() - (wallClockAsUtc(instant, timeZone) - instant);
  return new Date(instant);
}
