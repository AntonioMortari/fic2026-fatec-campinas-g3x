import { forwardRef } from 'react'
import { CONTACTS } from '../../lib/contacts'
import { Button } from '../ui'

export const ContactSent = forwardRef<HTMLDivElement>(function ContactSent(_props, ref) {
  return (
    <div ref={ref} role="status" tabIndex={-1} className="flex animate-rise flex-col gap-3 border-[1.5px] border-brown bg-card p-4 outline-none focus-visible:shadow-focus">
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true" className="size-2.5 shrink-0 bg-ochre" />
        <h2 className="m-0 text-item font-bold">Mensagem recebida</h2>
      </div>
      <p className="m-0 text-[0.96875rem] leading-[1.55]">
        Ela ficou registrada com o Ateliê. Se for urgente, chame no WhatsApp {CONTACTS.phoneDisplay}: é o caminho mais rápido.
      </p>
      <Button href={CONTACTS.whatsapp} target="_blank" rel="noreferrer" variant="secondary" className="min-h-12 w-full text-[0.9375rem]">
        Chamar no WhatsApp
      </Button>
    </div>
  )
})
