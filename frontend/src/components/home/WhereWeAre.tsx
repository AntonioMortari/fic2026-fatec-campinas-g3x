import { CONTACTS } from '../../lib/contacts'
import { Container } from '../ui'

const ADDRESS_LINE = 'Rua Dr. Paulo Gatti, 135 — Vila Romero'
const CITY_LINE = `São Paulo/SP — CEP ${CONTACTS.postalCode}`
const query = encodeURIComponent(CONTACTS.address)
const DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${query}`
const ACTION = 'flex items-center justify-center border-[1.5px] border-brown px-4.5 text-[0.9375rem] leading-[normal] font-semibold text-brown no-underline hover:text-brown'

function Actions({ className, actionClass }: { className: string; actionClass: string }) {
  return (
    <div className={className}>
      <a href={DIRECTIONS} target="_blank" rel="noreferrer" className={`${ACTION} ${actionClass}`}>
        Como chegar <span className="sr-only">(abre o mapa em outra aba)</span>
      </a>
      <a href={CONTACTS.whatsapp} target="_blank" rel="noreferrer" className={`${ACTION} ${actionClass}`}>
        WhatsApp <span className="sr-only">(abre em outra aba)</span>
      </a>
    </div>
  )
}

// Design 14a: text, address and the two actions on the left, the map card on the right. Design 14b: one card with the map, the address
// and the actions. "Como isso afeta sua privacidade" is not a link yet: the privacy page does not exist. The phone design has no
// privacy line under the map; it is kept here, because the map is Google's.
export function WhereWeAre() {
  return (
    <Container
      as="section"
      aria-labelledby="where-title"
      className="flex flex-col gap-3 pt-11 pb-11 desktop:grid desktop:grid-cols-[26.25rem_minmax(0,1fr)] desktop:items-stretch desktop:gap-12 desktop:pt-20 desktop:pb-22"
    >
      <div className="flex flex-col gap-3 desktop:gap-3.5">
        <h2 id="where-title" className="m-0 text-[1.5rem] leading-[1.15] font-bold desktop:text-[1.75rem] desktop:leading-[normal]">
          Onde estamos
        </h2>
        <p className="m-0 text-[0.96875rem] leading-[1.6] text-brown-600 desktop:text-[1.0625rem]">
          Ficamos no bairro da Casa Verde, zona norte de São Paulo, um lugar de grande e importantíssima historicidade e presença negra.
        </p>
        <address className="hidden flex-col gap-0.5 border-y border-t-[1.5px] border-brown border-b-brown/30 py-4 text-[1.0625rem] leading-[1.5] font-semibold not-italic desktop:flex">
          {ADDRESS_LINE}
          <span className="font-normal text-brown-600">{CITY_LINE}</span>
        </address>
        <Actions className="hidden flex-wrap gap-2.5 desktop:flex" actionClass="min-h-12" />
      </div>
      <div className="flex flex-col border-[1.5px] border-brown bg-card">
        <iframe
          title={`Mapa: ${ADDRESS_LINE}`}
          src={`https://www.google.com/maps?q=${query}&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="block h-45 w-full border-0 border-b-[1.5px] border-brown bg-cream-dark desktop:h-auto desktop:min-h-70 desktop:flex-1 desktop:border-b-0"
        />
        <span className="border-t border-brown/30 bg-card px-3.5 py-2.5 text-[0.84375rem] leading-[1.45] text-brown-600 desktop:text-[0.875rem]">
          O mapa é carregado do Google. Como isso afeta sua privacidade.
        </span>
        <address className="px-4 py-3.5 text-[1rem] leading-[1.5] font-bold not-italic desktop:hidden">
          {ADDRESS_LINE}
          <br />
          <span className="font-normal text-brown-600">{CITY_LINE}</span>
        </address>
        <Actions className="grid grid-cols-2 border-t-[1.5px] border-brown desktop:hidden" actionClass="min-h-12.5 border-0 first:border-r-[1.5px]" />
      </div>
    </Container>
  )
}
