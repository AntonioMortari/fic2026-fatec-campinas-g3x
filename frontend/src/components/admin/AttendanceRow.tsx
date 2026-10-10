import { cn } from '../../lib/cn'
import type { AttendanceEntry } from '../../types/attendance'

interface AttendanceRowProps {
  entry: AttendanceEntry
  displayName: string
  onMark: (attended: boolean | null) => void
}

const ROW = 'flex items-center gap-2 border-b border-line'

function Names({ entry, displayName, muted }: { entry: AttendanceEntry; displayName: string; muted?: boolean }) {
  return (
    <div className="min-w-0 flex-1">
      <span className={cn('block text-body break-words', muted ? 'font-semibold text-brown-400' : 'font-bold')}>{displayName}</span>
      {entry.isMinor && !muted && (
        <span className="block text-[0.8125rem] text-brown-400">
          Responsável{entry.guardianPhoneHint ? `: ${entry.guardianPhoneHint}` : ''}
        </span>
      )}
    </div>
  )
}

export function AttendanceRow({ entry, displayName, onMark }: AttendanceRowProps) {
  if (entry.attended === null) {
    return (
      <li className={cn(ROW, 'min-h-17 py-2')}>
        <Names entry={entry} displayName={displayName} />
        <button
          type="button"
          onClick={() => onMark(true)}
          className="inline-grid min-h-12 min-w-16 cursor-pointer place-items-center border-[1.5px] border-brown bg-brown px-3 text-small font-semibold text-cream hover:bg-brown-800"
        >
          Veio <span className="sr-only">{displayName}</span>
        </button>
        <button
          type="button"
          onClick={() => onMark(false)}
          className="inline-grid min-h-12 min-w-16 cursor-pointer place-items-center border-[1.5px] border-brown bg-transparent px-3 text-small font-semibold text-brown hover:bg-hover"
        >
          Faltou <span className="sr-only">{displayName}</span>
        </button>
      </li>
    )
  }

  const came = entry.attended
  return (
    <li className={cn(ROW, 'min-h-15')}>
      <span
        className={cn(
          'shrink-0 px-2 py-0.5 text-[0.75rem] font-bold',
          came ? 'bg-ochre text-brown' : 'border-[1.5px] border-brown-400 text-brown-400',
        )}
      >
        {came ? 'Veio' : 'Faltou'}
      </span>
      <Names entry={entry} displayName={displayName} muted={!came} />
      <button
        type="button"
        onClick={() => onMark(null)}
        className="min-h-11 shrink-0 cursor-pointer bg-transparent px-1.5 text-small font-semibold text-blue-deep hover:text-brown"
      >
        Limpar <span className="sr-only">{displayName}</span>
      </button>
    </li>
  )
}
