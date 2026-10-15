import { CONTACTS } from '../../lib/contacts'

const LINK = 'flex min-h-11 items-center border-t border-line-strong/50 text-[0.9375rem] font-semibold text-blue-deep'

export function NewsFollowCard() {
  return (
    <aside aria-labelledby="follow-title" className="hidden flex-col gap-3.5 self-start border border-line bg-card p-6 desktop:col-start-2 desktop:row-span-2 desktop:row-start-1 desktop:mt-13 desktop:flex">
      <h2 id="follow-title" className="m-0 text-[1.125rem] leading-[1.25] font-bold">
        Acompanhe também
      </h2>
      <p className="m-0 text-[0.9375rem] leading-[1.5] text-brown-600">O dia a dia sai antes no Instagram.</p>
      <a href={CONTACTS.instagram} className={LINK}>
        {CONTACTS.instagramHandle}
      </a>
      <a href={CONTACTS.whatsapp} className={LINK}>
        WhatsApp {CONTACTS.phoneDisplay}
      </a>
    </aside>
  )
}
