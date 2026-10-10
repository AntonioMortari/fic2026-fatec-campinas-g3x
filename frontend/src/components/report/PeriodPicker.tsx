import { PERIOD_LABELS } from '../../lib/report'
import type { ReportPeriod } from '../../types/report'
import { Chevron, SegmentedField } from '../ui'

const OPTIONS = (Object.keys(PERIOD_LABELS) as ReportPeriod[]).map((value) => ({ value, label: PERIOD_LABELS[value] }))

interface PeriodPickerProps {
  period: ReportPeriod
  onPeriod: (period: ReportPeriod) => void
  label: string
  canGoForward: boolean
  onBack: () => void
  onForward: () => void
  desktop: boolean
}

const ARROW = 'inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center bg-transparent font-semibold not-disabled:hover:bg-hover disabled:cursor-not-allowed disabled:text-brown-300'

export function PeriodPicker({ period, onPeriod, label, canGoForward, onBack, onForward, desktop }: PeriodPickerProps) {
  const picker = <SegmentedField legend="Período" hideLegend name="report-period" options={OPTIONS} value={period} onChange={onPeriod} />

  if (desktop) {
    return (
      <div className="flex items-center gap-4 print:hidden">
        <div className="w-80">{picker}</div>
        <button type="button" onClick={onBack} className={`${ARROW} px-2.5 text-blue-deep`}>
          ‹ Anterior
        </button>
        <button type="button" onClick={onForward} disabled={!canGoForward} className={`${ARROW} px-2.5 text-blue-deep`}>
          Seguinte ›
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 print:hidden">
      {picker}
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Período anterior" className={ARROW}>
          <Chevron direction="left" />
        </button>
        <p role="status" className="m-0 text-body font-bold">{label}</p>
        <button type="button" onClick={onForward} disabled={!canGoForward} aria-label="Período seguinte" className={ARROW}>
          <Chevron direction="right" />
        </button>
      </div>
    </div>
  )
}
