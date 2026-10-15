import type { SpecRow } from '../../lib/schools'

export function SpecSheet({ rows }: { rows: SpecRow[] }) {
  return (
    <dl className="m-0 flex flex-col">
      {rows.map((row) => (
        <div key={row.term} className="grid grid-cols-[6.875rem_minmax(0,1fr)] gap-3 border-t border-line py-3 desktop:grid-cols-[7.5rem_minmax(0,1fr)]">
          <dt className="text-small font-semibold text-brown-400 desktop:text-[0.90625rem]">{row.term}</dt>
          <dd className="m-0 break-words text-[0.9375rem] leading-[1.45] font-semibold desktop:text-[0.96875rem]">{row.detail}</dd>
        </div>
      ))}
    </dl>
  )
}
