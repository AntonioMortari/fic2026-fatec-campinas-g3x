import type { ReactNode, SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { FieldMessages } from './FieldMessages'
import { FIELD_BOX } from './TextField'
import { useFieldIds } from './use-field-ids'

export interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: SelectOption[]
  hint?: ReactNode
  error?: string
}

export function SelectField({ label, options, hint, error, id, className, ...select }: SelectFieldProps) {
  const { fieldId, hintId, errorId, describedBy } = useFieldIds(id, Boolean(hint), Boolean(error))

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={fieldId} className="text-[0.9375rem] font-semibold">
        {label}
        {select.required && <span aria-hidden="true"> *</span>}
      </label>
      <div className={cn(FIELD_BOX, error && 'border-2 border-brown')}>
        <select
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="min-h-13 w-full min-w-0 flex-1 cursor-pointer bg-transparent px-3 text-body text-brown outline-none"
          {...select}
        >
          <option value="">Escolha uma opção</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <FieldMessages error={error} errorId={errorId} hint={hint} hintId={hintId} />
    </div>
  )
}
