import { CONTACTS } from '../../lib/contacts'

const MAP_QUERY = 'Rua Dr. Paulo Gatti, 135 - Vila Romero, São Paulo - SP, 02468-030'
const MAP_URL = `https://www.google.com/maps?output=embed&q=${encodeURIComponent(MAP_QUERY)}`

export function ContactLocation() {
  return (
    <section
      aria-labelledby="contact-location-title"
      className="flex flex-col gap-2.5 border-t-[1.5px] border-brown pt-5 desktop:grid desktop:grid-cols-[minmax(0,1fr)_15rem] desktop:gap-5 desktop:pt-6"
    >
      <div className="flex flex-col gap-2.5 desktop:gap-2">
        <h2 id="contact-location-title" className="m-0 text-h2 font-bold">
          Onde estamos
        </h2>
        <address className="m-0 text-body font-semibold not-italic">
          {CONTACTS.street}
          <br />
          {CONTACTS.city} — CEP {CONTACTS.postalCode}
        </address>
        <p className="m-0 text-[0.9375rem] leading-normal text-brown-600">Nossa sede fica no bairro da Casa Verde, zona norte de São Paulo.</p>
      </div>
      <div
        data-map-frame
        className="relative grid h-45 place-items-center overflow-hidden border border-line bg-[repeating-linear-gradient(45deg,var(--color-cream-dark)_0_8px,#e4d8c4_8px_16px)] text-[0.8125rem] font-semibold text-brown-400 desktop:h-auto desktop:min-h-37.5"
      >
        <span aria-hidden="true">Mapa</span>
        <iframe
          src={MAP_URL}
          title="Mapa da sede do Ateliê Afro Cultural"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 size-full border-0"
        />
      </div>
    </section>
  )
}
