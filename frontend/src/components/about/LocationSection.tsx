import { CONTACTS } from '../../lib/contacts'

const ADDRESS_LINE = 'Rua Dr. Paulo Gatti, 135 — Vila Romero'
const query = encodeURIComponent(CONTACTS.address)
const MAP_NOTE = 'O mapa é carregado do Google. Como isso afeta sua privacidade.'
const DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${query}`

const SHORT =
  'Um lugar de grande e importantíssima historicidade e presença negra. Daqui propomos atividades que aproximam as crianças da riqueza cultural afro-brasileira, para elevar o respeito e a autoestima de cada uma sobre si mesma e seu lugar no mundo.'
const LONG =
  'Um lugar de grande e importantíssima historicidade e presença negra. O ateliê propõe atividades que possibilitam aproximar as crianças da riqueza cultural afro-brasileira, aprofundando o estudo das raízes culturais africanas, visando elevar o respeito e a autoestima da criança, na sua percepção e atuação sobre si mesma e seu lugar no mundo.'

function Map({ className }: { className: string }) {
  return (
    <iframe
      title={`Mapa: ${ADDRESS_LINE}`}
      src={`https://www.google.com/maps?q=${query}&output=embed`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className={className}
    />
  )
}

function Directions({ className }: { className: string }) {
  return (
    <a href={DIRECTIONS} target="_blank" rel="noreferrer" className={className}>
      Como chegar <span className="sr-only">(abre o mapa em outra aba)</span>
    </a>
  )
}

const OVERLINE = 'm-0 text-[0.6875rem] leading-[normal] font-bold uppercase tracking-[0.12em] text-ochre-deep desktop:text-overline'
const NOTICE = 'm-0 border-[1.5px] border-brown bg-card px-4 py-3.5 text-[0.96875rem] leading-[1.55] shadow-applique-ochre desktop:px-4.5 desktop:py-4 desktop:text-[1.0625rem] desktop:leading-[1.6]'
const NOTICE_TEXT = 'Sabemos que há necessidade de trabalhar e conscientizar o público infantil acerca das práticas e representações que configuram o racismo.'
const LINK = 'inline-flex items-center leading-[normal] border-[1.5px] border-brown font-semibold text-brown no-underline hover:text-brown'

// Design 15a: text and notice on the left, the map card with its address row on the right. Design 15b: everything in one column,
// the privacy line under the map and the address with the directions button below it. "Como isso afeta sua privacidade" is not a
// link yet: the privacy page does not exist, and a link to the 404 is worse than none.
export function LocationSection({ desktop }: { desktop: boolean }) {
  if (desktop) {
    return (
      <section id="onde-estamos" aria-labelledby="location-title" className="mx-auto grid w-full max-w-page scroll-mt-40 grid-cols-[30rem_minmax(0,1fr)] items-stretch gap-14 px-8 pt-24">
        <div className="flex flex-col gap-4">
          <p className={OVERLINE}>Onde estamos</p>
          <h2 id="location-title" className="m-0 text-[2.25rem] leading-[1.15] font-bold">
            Casa Verde, zona norte de São Paulo
          </h2>
          <p className="m-0 text-[1.09375rem] leading-[1.65] text-brown-600">{LONG}</p>
          <p className={NOTICE}>{NOTICE_TEXT}</p>
        </div>
        <div className="flex flex-col border-[1.5px] border-brown">
          <Map className="block min-h-80 w-full flex-1 border-0 bg-cream-dark" />
          <div className="flex items-center justify-between gap-4 border-t-[1.5px] border-brown bg-card px-4 py-3.5">
            <address className="text-[1rem] leading-[1.45] font-semibold not-italic">
              {ADDRESS_LINE}
              <span className="block text-[0.875rem] font-normal text-brown-600">{MAP_NOTE}</span>
            </address>
            <Directions className={`${LINK} min-h-12 flex-none px-4.5 text-[0.9375rem]`} />
          </div>
        </div>
      </section>
    )
  }
  return (
    <section id="onde-estamos" aria-labelledby="location-title" className="flex scroll-mt-32 flex-col gap-3.5 px-4 pt-11 desktop:scroll-mt-40">
      <p className={OVERLINE}>Onde estamos</p>
      <h2 id="location-title" className="m-0 text-[1.625rem] leading-[1.15] font-bold">
        Casa Verde, zona norte de São Paulo
      </h2>
      <p className="m-0 text-body leading-[1.6]">{SHORT}</p>
      <p className={NOTICE}>{NOTICE_TEXT}</p>
      <div className="flex flex-col border-[1.5px] border-brown">
        <Map className="block aspect-[16/10] w-full border-0 bg-cream-dark" />
        <span className="border-t border-brown/30 bg-card px-3 py-2.5 text-[0.84375rem] leading-[1.45] text-brown-600">{MAP_NOTE}</span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5">
        <span className="text-[0.90625rem] leading-[1.45] text-brown-600">{ADDRESS_LINE}</span>
        <Directions className={`${LINK} min-h-11 px-3.5 text-small`} />
      </div>
    </section>
  )
}
