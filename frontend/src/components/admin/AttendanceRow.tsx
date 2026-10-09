import { cn } from '../../lib/cn'
import type { AttendanceEntry } from '../../types/attendance'
import { Card } from '../ui'

interface AttendanceRowProps {
  entry: AttendanceEntry
  onMark: (attended: boolean | null) => void
}

const STATE_TEXT = { true: 'Veio', false: 'Não veio', null: 'Ainda não conferido' } as const

function MarkButton({ pressed, label, name, onClick }: { pressed: boolean; label: string; name: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-13 cursor-pointer items-center justify-center gap-1.5 border-[1.5px] border-brown px-3 text-body font-semibold select-none',
        'transition-[transform,background-color] duration-[90ms] active:scale-[.98]',
        pressed ? 'bg-brown text-cream' : 'bg-transparent text-brown',
      )}
    >
      {pressed && <span aria-hidden="true">✓</span>}
      {label} <span className="sr-only">{name}</span>
    </button>
  )
}

export function AttendanceRow({ entry, onMark }: AttendanceRowProps) {
  const { name, isMinor, attended } = entry

  return (
    <Card as="li" className="flex flex-col gap-3 p-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="m-0 text-h3 leading-tight font-bold break-words">{name}</h3>
        <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-brown-400">
          <span>{STATE_TEXT[String(attended) as keyof typeof STATE_TEXT]}</span>
          {isMinor && (
            <span className="border-[1.5px] border-brown px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-brown">
              Menor de idade
            </span>
          )}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <MarkButton pressed={attended === true} label="Veio" name={name} onClick={() => onMark(attended === true ? null : true)} />
        <MarkButton pressed={attended === false} label="Não veio" name={name} onClick={() => onMark(attended === false ? null : false)} />
      </div>
    </Card>
  )
}
