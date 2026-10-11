import { useEffect, useRef, useState } from 'react'
import { ContactChannels } from '../components/contact/ContactChannels'
import { ContactForm } from '../components/contact/ContactForm'
import { ContactLocation } from '../components/contact/ContactLocation'
import { ContactSent } from '../components/contact/ContactSent'
import { Button, Container } from '../components/ui'
import { CONTACTS } from '../lib/contacts'

const LEAD = 'Escolas, instituições, empresas, imprensa ou qualquer pessoa que queira conhecer o ateliê: escreva pelo canal que preferir.'
const LEAD_CLASSES = 'm-0 text-body text-pretty text-brown-600 desktop:text-[1.1875rem]'
const TITLE_CLASSES = 'm-0 text-h1 font-bold text-pretty desktop:text-h1-desktop'

export function Contact() {
  const [sentCount, setSentCount] = useState(0)
  const sentBox = useRef<HTMLDivElement>(null)
  const sent = sentCount > 0

  useEffect(() => {
    if (sentCount === 0) return
    sentBox.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [sentCount])

  return (
    <Container className="flex flex-col gap-5.5 pt-6 pb-12 desktop:grid desktop:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] desktop:gap-x-20 desktop:gap-y-7 desktop:pt-14 desktop:pb-18">
      <div className="flex flex-col gap-5.5 desktop:col-start-1 desktop:row-start-1 desktop:gap-7">
        {sent ? (
          <>
            <h1 className={TITLE_CLASSES}>Fale com a gente</h1>
            <ContactSent ref={sentBox} />
            <p className={LEAD_CLASSES}>{LEAD}</p>
          </>
        ) : (
          <>
            <header className="flex flex-col gap-2 desktop:gap-3">
              <p className="m-0 text-overline leading-[1.2] font-semibold uppercase tracking-[0.12em] text-ochre-deep">Contato</p>
              <h1 className={TITLE_CLASSES}>Fale com a gente</h1>
              <p className={LEAD_CLASSES}>{LEAD}</p>
            </header>
            <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-2.5 desktop:flex desktop:gap-3">
              <Button href={CONTACTS.whatsapp} target="_blank" rel="noreferrer" variant="applique" className="min-h-14 max-desktop:px-2 desktop:min-h-13 desktop:px-6">
                Chamar no WhatsApp
              </Button>
              <Button href={CONTACTS.phoneLink} variant="secondary" className="min-h-14 max-desktop:px-2 desktop:min-h-13 desktop:px-6">
                Ligar
              </Button>
            </div>
          </>
        )}
        <ContactChannels />
      </div>

      <section
        aria-labelledby="contact-form-title"
        className="flex flex-col gap-4 border-t-[1.5px] border-brown pt-5 desktop:col-start-2 desktop:row-span-2 desktop:row-start-1 desktop:gap-4.5 desktop:self-start desktop:border-[1.5px] desktop:bg-card desktop:p-8"
      >
        <h2 id="contact-form-title" className="m-0 text-h2 font-bold desktop:text-[1.625rem] desktop:leading-[1.2]">
          Ou mande uma mensagem por aqui
        </h2>
        <ContactForm key={sentCount} onSent={() => setSentCount((count) => count + 1)} />
      </section>

      <div className="desktop:col-start-1 desktop:row-start-2">
        <ContactLocation />
      </div>
    </Container>
  )
}
