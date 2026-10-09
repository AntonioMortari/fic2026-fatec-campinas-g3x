import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { fieldBox } from './field-styles'
import { FieldMessages } from './FieldMessages'
import { useFieldIds } from './use-field-ids'

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  labelNote?: string
  hint?: ReactNode
  error?: string
  addon?: ReactNode
}

export function TextField({ label, labelNote, hint, error, addon, id, className, ...input }: TextFieldProps) {
  const { fieldId, hintId, errorId, describedBy } = useFieldIds(id, Boolean(hint), Boolean(error))

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={fieldId} className="text-[0.9375rem] font-semibold">
        {label}
        {labelNote && <span className="font-normal text-brown-400"> {labelNote}</span>}
        {input.required && <span aria-hidden="true"> *</span>}
      </label>
      <div className={fieldBox(Boolean(error))}>
        <input
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="min-h-13 w-full min-w-0 flex-1 bg-transparent px-3.5 text-body text-brown outline-none placeholder:text-brown-300"
          {...input}
        />
        {addon}
      </div>
      <FieldMessages error={error} errorId={errorId} hint={hint} hintId={hintId} />
    </div>
  )
}
