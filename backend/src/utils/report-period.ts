import { localToUtc, ORGANIZATION_TIME_ZONE } from './time-zone';

export type ReportPeriod = 'month' | 'quarter' | 'semester';

const LENGTH_IN_MONTHS: Record<ReportPeriod, number> = { month: 1, quarter: 3, semester: 6 };
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const SHORT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export interface ReportRange {
  from: Date;
  to: Date;
  label: string;
}

function monthIndexNow(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: ORGANIZATION_TIME_ZONE, year: 'numeric', month: 'numeric' }).formatToParts(now);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return value('year') * 12 + (value('month') - 1);
}

// The first instant of a month on the wall clock of the organization: the report closes its months at midnight in São Paulo.
function startOfMonth(index: number): Date {
  const year = Math.floor(index / 12);
  const month = String((index % 12) + 1).padStart(2, '0');
  return localToUtc(`${year}-${month}-01T00:00`) as Date;
}

// A window of 1, 3 or 6 months that ends in the current month; offset -1 is the window right before it, and so on.
// `to` is exclusive: an event at exactly midnight of the next month belongs to the next window.
export function reportRange(period: ReportPeriod, offset: number, now: Date = new Date()): ReportRange {
  const length = LENGTH_IN_MONTHS[period];
  const end = monthIndexNow(now) + offset * length;
  const start = end - length + 1;
  const startYear = Math.floor(start / 12);
  const endYear = Math.floor(end / 12);

  let label: string;
  if (period === 'month') label = `${MONTHS[end % 12]} de ${endYear}`;
  else if (startYear === endYear) label = `${SHORT_MONTHS[start % 12]}–${SHORT_MONTHS[end % 12]} ${endYear}`;
  else label = `${SHORT_MONTHS[start % 12]} ${startYear}–${SHORT_MONTHS[end % 12]} ${endYear}`;

  return { from: startOfMonth(start), to: startOfMonth(end + 1), label };
}
