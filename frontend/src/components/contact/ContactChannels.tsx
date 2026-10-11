import { CONTACTS } from '../../lib/contacts'

interface Channel {
  label: string
  text: string
  href: string
  external: boolean
}

const CHANNELS: Channel[] = [
  { label: 'Telefone', text: CONTACTS.phoneDisplay, href: CONTACTS.phoneLink, external: false },
  { label: 'WhatsApp', text: CONTACTS.phoneDisplay, href: CONTACTS.whatsapp, external: true },
  { label: 'E-mail', text: CONTACTS.email, href: `mailto:${CONTACTS.email}`, external: false },
  { label: 'Instagram', text: CONTACTS.instagramHandle, href: CONTACTS.instagram, external: true },
  { label: 'TikTok', text: CONTACTS.tiktokHandle, href: CONTACTS.tiktok, external: true },
  { label: 'YouTube', text: 'Nosso canal', href: CONTACTS.youtube, external: true },
]

export function ContactChannels() {
  return (
    <section aria-labelledby="contact-channels-title" className="flex flex-col">
      <h2 id="contact-channels-title" className="m-0 pb-1.5 text-overline leading-[1.2] font-semibold uppercase tracking-[0.12em] text-brown-400">
        Canais diretos
      </h2>
      <dl className="m-0 flex flex-col">
        {CHANNELS.map((channel) => (
          <div
            key={channel.label}
            className="flex min-h-13 flex-wrap items-center gap-x-3 border-t border-line desktop:min-h-12.5 desktop:gap-x-4"
          >
            <dt className="w-24 shrink-0 text-small font-semibold text-brown-400 desktop:w-30 desktop:text-[0.9375rem]">{channel.label}</dt>
            <dd className="m-0 min-w-0 flex-1 basis-40">
              <a
                href={channel.href}
                {...(channel.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                className="flex min-h-11 items-center text-[0.96875rem] font-semibold [overflow-wrap:anywhere] no-underline hover:underline desktop:text-base"
              >
                {channel.text}
              </a>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
