import type { ReportTotals } from '../../types/report'

interface Tile {
  value: number | null
  label: string
}

export function Totals({ totals }: { totals: ReportTotals }) {
  const tiles: Tile[] = [
    { value: totals.activities, label: 'atividades realizadas' },
    { value: totals.registered, label: 'pessoas inscritas' },
    { value: totals.attended, label: 'presentes conferidos' },
    { value: totals.minorsAttended, label: 'crianças e adolescentes presentes' },
  ]

  return (
    <dl className="m-0 grid grid-cols-2 border-[1.5px] border-brown bg-card desktop:grid-cols-4 desktop:border-x-0 desktop:border-b desktop:border-b-line desktop:bg-transparent">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="flex flex-col gap-1.5 border-b border-line p-4 odd:border-r desktop:border-b-0 desktop:border-r-0 desktop:border-l desktop:py-4.5 desktop:first:border-l-0 desktop:first:pl-0 desktop:odd:border-r-0"
        >
          <dd className="m-0 text-[2rem] leading-none font-bold desktop:order-first desktop:text-4xl">
            {tile.value === null ? <span aria-label="sem contagem">—</span> : tile.value}
          </dd>
          <dt className="text-small leading-snug text-brown-400">{tile.label}</dt>
        </div>
      ))}
    </dl>
  )
}

