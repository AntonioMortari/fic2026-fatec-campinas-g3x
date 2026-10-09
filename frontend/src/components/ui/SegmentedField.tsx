import { cn } from '../../lib/cn'
import { FieldMessages } from './FieldMessages'
import { useFieldIds } from './use-field-ids'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

interface SegmentedFieldProps<T extends string> {
  legend: string
  name: string
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  error?: string
  hideLegend?: boolean
}

// A few options side by side, one chosen: radio buttons underneath, so the keyboard and the screen reader get a real group.
export function SegmentedField<T extends string>({ legend, name, options, value, onChange, error, hideLegend = false }: SegmentedFieldProps<T>) {
  const { errorId } = useFieldIds(undefined, false, Boolean(error))

  return (
    <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0" aria-describedby={error ? errorId : undefined}>
      <legend className={cn('p-0 text-[0.9375rem] font-semibold', hideLegend ? 'sr-only' : 'mb-1.5')}>{legend}</legend>
      <div className={cn('grid overflow-hidden rounded-control border-[1.5px]', error ? 'border-error' : 'border-brown')} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex min-h-13 cursor-pointer items-center justify-center px-1.5 text-center text-[0.9375rem] font-semibold has-[:focus-visible]:shadow-[inset_0_0_0_3px_var(--color-blue)]',
              option.value === value ? 'bg-brown text-cream' : 'bg-transparent text-brown',
            )}
          >
            <input type="radio" name={name} value={option.value} checked={option.value === value} onChange={() => onChange(option.value)} className="sr-only" />
            {option.label}
          </label>
        ))}
      </div>
      <FieldMessages error={error} errorId={errorId} />
    </fieldset>
  )
}
