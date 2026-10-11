import { useId } from 'react'
import { CONTACT_STATUS_LABELS, CONTACT_STATUS_ORDER } from '../../lib/contacts-admin'
import { cn } from '../../lib/cn'
import type { ContactStatus } from '../../types/contacts'

interface ContactStatusPickerProps {
  name: string
  value: ContactStatus
  busy: boolean
  onChange: (status: ContactStatus) => void
}

export function ContactStatusPicker({ name, value, busy, onChange }: ContactStatusPickerProps) {
  const hintId = useId()

  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-2.5 border-0 p-0" aria-describedby={hintId} disabled={busy}>
      <legend className="mb-2.5 p-0 text-small leading-[1.2] font-semibold">Em que pé está</legend>
      <div className="grid grid-cols-3 gap-2 desktop:gap-0 desktop:border desktop:border-brown">
        {CONTACT_STATUS_ORDER.map((status) => {
          const checked = status === value
          return (
            <label
              key={status}
              className={cn(
                'flex min-h-12 cursor-pointer items-center justify-center border border-brown px-1 text-center text-[0.90625rem] font-semibold has-[:focus-visible]:shadow-[inset_0_0_0_3px_var(--color-blue)] desktop:min-h-11 desktop:border-0 desktop:text-[0.84375rem]',
                checked ? 'bg-brown text-cream' : 'bg-card text-brown hover:bg-hover',
                busy && 'cursor-wait opacity-70',
              )}
            >
              <input type="radio" name={name} value={status} checked={checked} onChange={() => onChange(status)} className="sr-only" />
              {CONTACT_STATUS_LABELS[status]}
            </label>
          )
        })}
      </div>
      <p id={hintId} className="m-0 text-[0.8125rem] leading-[1.45] text-brown-400">
        Dá para voltar atrás.
      </p>
    </fieldset>
  )
}
