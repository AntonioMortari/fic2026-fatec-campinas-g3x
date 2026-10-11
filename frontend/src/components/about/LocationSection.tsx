import { CONTACTS } from '../../lib/contacts'

const ADDRESS_LINE = 'Rua Dr. Paulo Gatti, 135 — Vila Romero'
const query = encodeURIComponent(CONTACTS.address)

export function LocationSection() {
  return (
    <section id="onde-estamos" aria-labelledby="location-title" className="flex scroll-mt-32 desktop:scroll-mt-40 flex-col gap-3.5 px-4 pt-10 desktop:px-0">
      <p className="m-0 text-overline font-semibold uppercase tracking-[0.12em] text-ochre-deep">Onde estamos</p>
      <h2 id="location-title" className="m-0 text-[1.625rem] leading-[1.15] font-bold">
        Casa Verde, zona norte de São Paulo
      </h2>
      <p className="m-0 text-body leading-[1.6]">
        Um lugar de grande e importantíssima historicidade e presença negra. Daqui propomos atividades que aproximam as crianças
        da riqueza cultural afro-brasileira, para elevar o respeito e a autoestima de cada uma sobre si mesma e seu lugar no mundo.
      </p>
      <p className="m-0 border border-line bg-card px-4 py-3.5 text-[0.9375rem] leading-[1.55] text-brown-600">
        Sabemos que há necessidade de trabalhar e conscientizar o público infantil acerca das práticas e representações que
        configuram o racismo.
      </p>
      <iframe
        title={`Mapa: ${ADDRESS_LINE}`}
        src={`https://www.google.com/maps?q=${query}&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="block aspect-[16/10] w-full border border-line bg-cream-dark"
      />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5">
        <span className="text-[0.90625rem] leading-[1.45] text-brown-600">{ADDRESS_LINE}</span>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${query}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center border-[1.5px] border-brown px-3.5 text-small font-semibold text-brown no-underline hover:text-brown"
        >
          Como chegar <span className="sr-only">(abre o mapa em outra aba)</span>
        </a>
      </div>
    </section>
  )
}
