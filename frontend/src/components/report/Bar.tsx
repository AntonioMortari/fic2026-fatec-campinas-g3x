import { barShares } from '../../lib/report'
import type { ReportEventRow } from '../../types/report'

const HATCH = 'bg-[repeating-linear-gradient(45deg,var(--color-brown)_0_2px,transparent_2px_5px)]'

// Ochre came, dark missed, hatched nobody checked: "not checked" is never drawn like a miss. The numbers are the
// information, so the bar is only decoration for the reader of a screen. The colors must survive printing: a browser
// drops backgrounds on paper unless told otherwise, and then the bars would be empty.
export function Bar({ row }: { row: ReportEventRow }) {
  const shares = barShares(row)
  return (
    <div aria-hidden="true" className="flex h-2.5 w-full bg-cream-dark [print-color-adjust:exact]">
      {shares && (
        <>
          <span className="bg-ochre" style={{ width: `${shares.attended}%` }} />
          <span className="bg-brown" style={{ width: `${shares.missed}%` }} />
          <span className={HATCH} style={{ width: `${shares.unchecked}%` }} />
        </>
      )}
    </div>
  )
}

export function Swatch({ kind }: { kind: 'attended' | 'missed' | 'unchecked' }) {
  const style = kind === 'attended' ? 'bg-ochre' : kind === 'missed' ? 'bg-brown' : HATCH
  return <span aria-hidden="true" className={`inline-block size-3 shrink-0 [print-color-adjust:exact] ${style}`} />
}
