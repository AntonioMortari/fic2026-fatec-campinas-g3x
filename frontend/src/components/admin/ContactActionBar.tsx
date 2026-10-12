import { NEXT_CONTACT_STEP, whatsappLink } from '../../lib/contacts-admin'
import { cn } from '../../lib/cn'
import type { AdminContact, ContactStatus } from '../../types/contacts'
import { Button } from '../ui'

interface ContactActionBarProps {
  contact: AdminContact
  busy: boolean
  onAdvance: (status: ContactStatus) => void
}

const SECONDARY = 'min-h-13 min-w-0 flex-none px-3! text-[0.9375rem] desktop:text-small'

export function ContactActionBar({ contact, busy, onAdvance }: ContactActionBarProps) {
  const next = NEXT_CONTACT_STEP[contact.status]

  return (
    <div className={cn('safe-area-bottom fixed inset-x-0 bottom-0 z-30 flex gap-2.5 border-t border-line bg-cream px-4 pt-3', 'desktop:static desktop:z-auto desktop:px-8 desktop:py-5')}>
      <Button href={`mailto:${contact.email}`} variant="secondary" size="compact" className={SECONDARY}>
        <span className="desktop:hidden">E-mail</span>
        <span className="hidden desktop:inline">Responder por e-mail</span>
      </Button>
      {contact.phone ? (
        <Button href={whatsappLink(contact.phone)} target="_blank" rel="noreferrer" variant="secondary" size="compact" className={SECONDARY}>
          WhatsApp <span className="sr-only">(abre em outra aba)</span>
        </Button>
      ) : (
        <Button variant="secondary" size="compact" disabled className={SECONDARY}>
          WhatsApp <span className="sr-only">indisponível: a pessoa não informou telefone</span>
        </Button>
      )}
      <Button
        variant="applique"
        loading={busy}
        onClick={() => onAdvance(next.to)}
        aria-label={next.label}
        className="min-h-13 min-w-0 flex-1 px-2! text-[0.9375rem]"
      >
        <span className="desktop:hidden">{next.short}</span>
        <span className="hidden desktop:inline">{next.label}</span>
      </Button>
    </div>
  )
}
