import type { VolunteerArea } from '../../types/volunteering'

export function AreaOverview({ areas }: { areas: VolunteerArea[] }) {
  return (
    <ol className="m-0 list-none border-b border-line p-0">
      {areas.map((area, index) => (
        <li key={area.id} className="grid grid-cols-[2.375rem_minmax(0,1fr)] border-t border-line py-3.5">
          <span aria-hidden="true" className="text-[0.9375rem] leading-[1.2] font-bold text-ochre-deep">
            {index + 1}
          </span>
          <div className="flex flex-col gap-[3px]">
            <h3 className="m-0 text-[1.03125rem] leading-[1.15] font-bold">{area.name}</h3>
            <p className="m-0 text-[0.90625rem] leading-[1.45] text-brown-600">{area.description}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
