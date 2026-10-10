import { Link } from 'react-router-dom'
import { CONTACTS } from '../../lib/contacts'
import { StripedBand } from '../ui/StripedBand'
import { Logo } from './Logo'

const LINK = 'inline-flex min-h-11 items-center'

export function Footer() {
  return (
    <footer>
      <StripedBand />
      <div className="mx-auto flex max-w-page flex-col gap-1.5 px-4 pt-5.5 pb-7 text-small text-brown-400 desktop:flex-row desktop:text-[0.9375rem] desktop:items-center desktop:justify-between desktop:gap-8 desktop:px-8">
        <div className="hidden desktop:block">
          <Logo className="h-7" />
        </div>
        <p className="m-0 desktop:flex-1">
          {CONTACTS.address}
          <span className="hidden desktop:inline"> · {CONTACTS.phoneDisplay}</span>
        </p>
        <ul className="m-0 flex list-none flex-wrap gap-x-4 p-0 desktop:gap-x-5">
          <li>
            <a className={LINK} href={CONTACTS.whatsapp} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </li>
          <li>
            <a className={LINK} href={CONTACTS.instagram} target="_blank" rel="noreferrer">
              Instagram
            </a>
          </li>
          <li className="hidden desktop:list-item">
            <a className={LINK} href={CONTACTS.tiktok} target="_blank" rel="noreferrer">
              TikTok
            </a>
          </li>
          <li>
            <a className={LINK} href={`mailto:${CONTACTS.email}`}>
              E-mail
            </a>
          </li>
          <li>
            <Link className={LINK} to="/privacidade">
              Privacidade
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  )
}
