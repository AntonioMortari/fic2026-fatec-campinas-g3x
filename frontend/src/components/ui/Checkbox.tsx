import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { FieldMessages } from './FieldMessages'
import { useFieldIds } from './use-field-ids'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  hint?: ReactNode
  error?: string
}

export function Checkbox({ label, hint, error, id, className, ...input }: CheckboxProps) {
  const { fieldId, hintId, errorId, describedBy } = useFieldIds(id, Boolean(hint), Boolean(error))

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={fieldId} className="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-body font-semibold">
        <input
          id={fieldId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={
            'relative mt-0.5 size-6 shrink-0 cursor-pointer appearance-none border-[1.5px] border-brown bg-transparent transition-colors duration-(--motion-touch) checked:bg-brown ' +
            "after:absolute after:top-0.5 after:left-[0.4375rem] after:h-[0.8125rem] after:w-[0.4375rem] after:rotate-45 after:scale-0 after:border-r-[2.5px] after:border-b-[2.5px] after:border-cream after:transition-[scale] after:duration-(--motion-change) after:ease-(--ease-motion) after:content-[''] checked:after:scale-100 " +
            'aria-[invalid=true]:outline-2 aria-[invalid=true]:outline-offset-2 aria-[invalid=true]:outline-error'
          }
          {...input}
        />
        <span>{label}</span>
      </label>
      <div className="flex flex-col gap-1 pl-9">
        <FieldMessages error={error} errorId={errorId} hint={hint} hintId={hintId} />
      </div>
    </div>
  )
}
