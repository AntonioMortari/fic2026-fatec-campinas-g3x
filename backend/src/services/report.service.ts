import { col, fn, Op } from 'sequelize';
import { Event, Registration } from '../models';
import { toCsv } from '../utils/csv';
import { reportRange, type ReportPeriod } from '../utils/report-period';
import { isOver } from './events.service';

// How many activities the on-screen table lists. The totals above it and the spreadsheet cover all of them.
export const LISTED_EVENTS = 5;

// A count that could not be taken is null, never 0: zero is a number the staff would put in a prestação de contas.
export interface ReportTotals {
  activities: number | null;
  registered: number | null;
  attended: number | null;
  missed: number | null;
  unchecked: number | null;
  minorsAttended: number | null;
}

export interface ReportEventRow {
  id: string;
  title: string;
  startsAt: string;
  registered: number | null;
  attended: number | null;
  missed: number | null;
  unchecked: number | null;
}

export interface Report {
  period: ReportPeriod;
  offset: number;
  label: string;
  totals: ReportTotals;
  events: ReportEventRow[];
  eventsTotal: number | null;
}

interface Counts {
  registered: number;
  attended: number;
  missed: number;
  unchecked: number;
  minorsAttended: number;
}

const EMPTY: Counts = { registered: 0, attended: 0, missed: 0, unchecked: 0, minorsAttended: 0 };

async function countByEvent(eventIds: string[]): Promise<Map<string, Counts>> {
  const byEvent = new Map<string, Counts>(eventIds.map((id) => [id, { ...EMPTY }]));
  if (eventIds.length === 0) return byEvent;

  const rows = (await Registration.findAll({
    attributes: ['eventId', 'attended', 'isMinor', [fn('COUNT', col('id')), 'total']],
    where: { eventId: { [Op.in]: eventIds }, cancelledAt: null },
    group: ['eventId', 'attended', 'isMinor'],
    raw: true,
  })) as unknown as { eventId: string; attended: number | boolean | null; isMinor: number | boolean; total: number | string }[];

  for (const row of rows) {
    const counts = byEvent.get(row.eventId);
    if (!counts) continue;
    const total = Number(row.total);
    counts.registered += total;
    if (row.attended === null) counts.unchecked += total;
    else if (Boolean(row.attended)) {
      counts.attended += total;
      if (Boolean(row.isMinor)) counts.minorsAttended += total;
    } else counts.missed += total;
  }
  return byEvent;
}

const sum = (rows: Counts[], key: keyof Counts): number => rows.reduce((total, row) => total + row[key], 0);

async function finishedEvents(from: Date, to: Date, now: Date): Promise<Event[] | null> {
  try {
    const events = await Event.findAll({ where: { published: true, startsAt: { [Op.gte]: from, [Op.lt]: to } }, order: [['startsAt', 'DESC']] });
    return events.filter((event) => isOver(event, now));
  } catch (error) {
    console.error('[report] could not list the activities', error);
    return null;
  }
}

async function countsOrNull(eventIds: string[]): Promise<Map<string, Counts> | null> {
  try {
    return await countByEvent(eventIds);
  } catch (error) {
    console.error('[report] could not count the sign-ups', error);
    return null;
  }
}

// "Activities held" are the published ones that already ended inside the window; every other number counts only their
// sign-ups (cancelled ones are out). The two reads fail apart, so one bad query turns its numbers into dashes and not into zeros.
export async function buildReport(period: ReportPeriod, offset: number, now: Date = new Date()): Promise<{ report: Report; all: ReportEventRow[] }> {
  const range = reportRange(period, offset, now);
  const events = await finishedEvents(range.from, range.to, now);
  const counts = events ? await countsOrNull(events.map((event) => event.id)) : null;

  const rowFor = (event: Event): ReportEventRow => {
    const c = counts?.get(event.id);
    return {
      id: event.id,
      title: event.title,
      startsAt: event.startsAt.toISOString(),
      registered: c?.registered ?? null,
      attended: c?.attended ?? null,
      missed: c?.missed ?? null,
      unchecked: c?.unchecked ?? null,
    };
  };

  const all = (events ?? []).map(rowFor);
  const rows = counts ? [...counts.values()] : null;
  const totals: ReportTotals = {
    activities: events ? events.length : null,
    registered: rows ? sum(rows, 'registered') : null,
    attended: rows ? sum(rows, 'attended') : null,
    missed: rows ? sum(rows, 'missed') : null,
    unchecked: rows ? sum(rows, 'unchecked') : null,
    minorsAttended: rows ? sum(rows, 'minorsAttended') : null,
  };

  return {
    report: { period, offset, label: range.label, totals, events: all.slice(0, LISTED_EVENTS), eventsTotal: events ? events.length : null },
    all,
  };
}

const DASH = '—';
const cell = (value: number | null) => (value === null ? DASH : value);

function formatDay(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
}

// Every activity of the window, not only the five on screen, and a dash where a count could not be taken.
export function reportCsv(report: Report, all: ReportEventRow[]): string {
  const header = ['Atividade', 'Data', 'Inscritos', 'Vieram', 'Faltaram', 'Sem conferir'];
  const rows = all.map((row) => [row.title, formatDay(row.startsAt), cell(row.registered), cell(row.attended), cell(row.missed), cell(row.unchecked)]);
  const { totals } = report;
  const total = ['Total', '', cell(totals.registered), cell(totals.attended), cell(totals.missed), cell(totals.unchecked)];
  return toCsv([[`Relatório — ${report.label}`], [], header, ...rows, total]);
}
