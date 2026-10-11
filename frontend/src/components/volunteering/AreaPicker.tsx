import { cn } from '../../lib/cn'
import type { VolunteerArea } from '../../types/volunteering'

interface AreaPickerProps {
  areas: VolunteerArea[]
  selected: string[]
  onToggle: (id: string) => void
  describedBy?: string
}

function Check() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 fill-none stroke-cream" strokeWidth="2.2" strokeLinecap="square">
      <path d="M3 8.5 6.5 12 13 4.5" />
    </svg>
  )
}

export function AreaPicker({ areas, selected, onToggle, describedBy }: AreaPickerProps) {
  const count = selected.length

  return (
    <fieldset className="m-0 flex min-w-0 flex-col border-0 p-0" aria-describedby={describedBy}>
      <legend className="p-0">
        <span className="block text-[1.125rem] leading-[1.2] font-bold">Onde você quer ajudar?</span>
        <span className="mt-1 mb-3 block text-small leading-[1.2] font-normal text-brown-400">
          Pode marcar mais de uma · {count === 1 ? '1 marcada' : `${count} marcadas`}
        </span>
      </legend>
      <ul className="m-0 grid w-full list-none grid-cols-1 gap-2 p-0 desktop:grid-cols-2 desktop:gap-2.5">
        {areas.map((area) => {
          const checked = selected.includes(area.id)
          return (
            <li key={area.id}>
              <label
                className={cn(
                  'flex h-full min-h-16 cursor-pointer items-start gap-3 border px-3.5 py-3 has-[:focus-visible]:shadow-focus',
                  checked ? 'border-brown bg-card' : 'border-brown/30 bg-transparent hover:bg-hover',
                )}
              >
                <input type="checkbox" className="peer sr-only" checked={checked} onChange={() => onToggle(area.id)} />
                <span
                  aria-hidden="true"
                  className={cn('mt-0.5 grid size-6.5 shrink-0 place-items-center border-2 border-brown', checked ? 'bg-brown' : 'bg-card')}
                >
                  {checked && <Check />}
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-[1rem] leading-[1.2] font-bold">{area.name}</span>
                  <span className="text-[0.84375rem] leading-[1.4] text-brown-600">{area.description}</span>
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}
