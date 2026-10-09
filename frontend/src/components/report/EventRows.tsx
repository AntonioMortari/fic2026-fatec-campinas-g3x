import { shortDate } from '../../lib/dates'
import { listTotals, show } from '../../lib/report'
import type { ReportEventRow } from '../../types/report'
import { Bar, Swatch } from './Bar'

const NUMBER = 'text-right tabular-nums'

export function EventTable({ rows, label }: { rows: ReportEventRow[]; label: string | null }) {
  const totals = listTotals(rows)
  return (
    <div className="flex flex-col">
      <p className="m-0 flex flex-wrap justify-end gap-x-4.5 pb-2.5 text-[0.84375rem] text-brown-600">
        <span className="flex items-center gap-1.5"><Swatch kind="attended" />vieram</span>
        <span className="flex items-center gap-1.5"><Swatch kind="missed" />faltaram</span>
        <span className="flex items-center gap-1.5"><Swatch kind="unchecked" />sem conferir</span>
      </p>
      <table className="w-full border-collapse text-[0.9375rem]">
        <thead>
          <tr className="border-y border-y-brown text-left text-[0.75rem] tracking-[0.08em] text-brown-400 uppercase">
            <th scope="col" className="py-2.5 pr-4 font-bold">Atividade</th>
            <th scope="col" className="px-4 py-2.5 font-bold">Quando</th>
            <th scope="col" className={`px-4 py-2.5 font-bold ${NUMBER}`}>Inscritos</th>
            <th scope="col" className={`px-4 py-2.5 font-bold ${NUMBER}`}>Vieram</th>
            <th scope="col" className={`px-4 py-2.5 font-bold ${NUMBER}`}>Faltaram</th>
            <th scope="col" className={`px-4 py-2.5 font-bold ${NUMBER}`}>Sem conferir</th>
            <th scope="col" className="w-[22%] py-2.5 pl-4"><span className="sr-only">Proporção</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="h-14 border-b border-line">
              <th scope="row" className="py-2 pr-4 text-left font-bold">{row.title}</th>
              <td className="px-4 whitespace-nowrap text-brown-600">{shortDate(row.startsAt)}</td>
              <td className={`px-4 font-bold ${NUMBER}`}>{show(row.registered)}</td>
              <td className={`px-4 ${NUMBER}`}>{show(row.attended)}</td>
              <td className={`px-4 ${NUMBER}`}>{show(row.missed)}</td>
              <td className={`px-4 ${NUMBER}`}>{show(row.unchecked)}</td>
              <td className="py-2 pl-4"><Bar row={row} /></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="h-13 font-bold">
            <th scope="row" className="pr-4 text-left">Total da lista</th>
            <td />
            <td className={`px-4 ${NUMBER}`}>{show(totals.registered)}</td>
            <td className={`px-4 ${NUMBER}`}>{show(totals.attended)}</td>
            <td className={`px-4 ${NUMBER}`}>{show(totals.missed)}</td>
            <td className={`px-4 ${NUMBER}`}>{show(totals.unchecked)}</td>
            <td className="pl-4 text-small font-normal text-brown-400">{label}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export function EventList({ rows }: { rows: ReportEventRow[] }) {
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {rows.map((row) => (
        <li key={row.id} className="flex flex-col gap-2 border-b border-line py-3.5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="m-0 text-body leading-tight font-bold">{row.title}</h3>
            <span className="shrink-0 text-small font-bold text-ochre-deep">{shortDate(row.startsAt).split(' ')[1]}</span>
          </div>
          <Bar row={row} />
          <p className="m-0 text-small text-brown-600">
            <strong className="text-brown">{show(row.registered)}</strong> inscritos · {show(row.attended)} vieram · {show(row.missed)} faltaram · {show(row.unchecked)} sem conferir
          </p>
        </li>
      ))}
    </ul>
  )
}
