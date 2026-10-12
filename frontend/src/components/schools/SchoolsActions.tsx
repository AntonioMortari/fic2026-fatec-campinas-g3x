import { CONTACTS } from '../../lib/contacts'
import { cn } from '../../lib/cn'
import { Button } from '../ui'

const MAILTO = `mailto:${CONTACTS.email}`

type Placement = 'bar' | 'hero' | 'card'

export function SchoolsActions({ placement, className }: { placement: Placement; className?: string }) {
  const whatsapp = (
    <Button
      href={CONTACTS.whatsapp}
      target="_blank"
      rel="noreferrer"
      variant="applique"
      className={cn(
        placement === 'bar' && 'min-h-12! w-full whitespace-nowrap px-4 text-[0.9375rem] min-[24rem]:flex-1',
        placement === 'hero' && 'min-h-13! px-6 text-body',
        placement === 'card' && 'min-h-13! w-full text-body',
      )}
    >
      Falar pelo WhatsApp
    </Button>
  )

  const email =
    placement === 'bar' ? (
      <a href={MAILTO} className="inline-flex min-h-11 items-center justify-center px-1.5 text-[0.9375rem] font-semibold whitespace-nowrap">
        Enviar e-mail
      </a>
    ) : (
      <Button href={MAILTO} variant="secondary" className={cn(placement === 'hero' && 'min-h-13! px-6', placement === 'card' && 'min-h-13! w-full')}>
        Enviar e-mail
      </Button>
    )

  return (
    <div className={className}>
      {whatsapp}
      {email}
    </div>
  )
}
