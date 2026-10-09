import type { ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { FieldMessages } from './FieldMessages'
import { fieldBox } from './field-styles'
import { useFieldIds } from './use-field-ids'

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: ReactNode
  error?: string
}

export function TextAreaField({ label, hint, error, id, className, rows = 5, ...textarea }: TextAreaFieldProps) {
  const { fieldId, hintId, errorId, describedBy } = useFieldIds(id, Boolean(hint), Boolean(error))

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={fieldId} className="text-[0.9375rem] font-semibold">
        {label}
        {textarea.required && <span aria-hidden="true"> *</span>}
      </label>
      <div className={fieldBox(Boolean(error), 'items-stretch')}>
        <textarea
          id={fieldId}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="min-h-26 w-full min-w-0 flex-1 resize-y bg-transparent px-3.5 py-3 text-body text-brown outline-none placeholder:text-brown-300"
          {...textarea}
        />
      </div>
      <FieldMessages error={error} errorId={errorId} hint={hint} hintId={hintId} />
    </div>
  )
}
