import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import { MAX_FONT_STEP, MIN_FONT_STEP } from '../../contexts/reading-context'
import { useReadingPreferences } from '../../contexts/useReadingPreferences'
import { cn } from '../../lib/cn'
import { CONTACTS } from '../../lib/contacts'
import { DESKTOP_MENU_GROUPS } from '../../lib/navigation'
import type { MenuSection } from './Menu'

const TONES = { ochre: 'text-ochre-deep', blue: 'text-blue-deep', brown: 'text-brown-400' }
const OVERLINE = 'm-0 text-overline font-semibold uppercase tracking-[0.12em]'
const READING_BUTTON =
  'grid min-h-11 cursor-pointer place-items-center rounded-control border border-brown px-0.5 text-small font-semibold'

interface DesktopMenuProps {
  open: boolean
  section: MenuSection
  onClose: () => void
}

export function DesktopMenu({ open, section, onClose }: DesktopMenuProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const firstLink = useRef<HTMLAnchorElement>(null)
  const readingHeading = useRef<HTMLHeadingElement>(null)
  const reading = useReadingPreferences()
  const { user } = useAuth()

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) {
      element.showModal()
      ;(section === 'reading' ? readingHeading : firstLink).current?.focus()
    } else if (!open && element.open) {
      element.close()
    }
  }, [open, section])

  return (
    <dialog
      ref={dialog}
      aria-labelledby="desktop-menu-title"
      onClose={onClose}
      onClick={(event) => {
        if (!(event.target as Element).closest('[data-menu-panel]')) onClose()
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 text-brown backdrop:bg-transparent"
    >
      <div className="flex h-full flex-col">
        <div aria-hidden="true" className="h-[calc(4.75rem+1px)] shrink-0" />
        <div data-menu-panel className="bg-card shadow-[0_18px_30px_rgb(43_32_25/0.12)]">
          <h2 id="desktop-menu-title" className="sr-only">
            Menu
          </h2>
          <div className="mx-auto grid max-w-page grid-cols-[repeat(3,minmax(0,1fr))_18.6875rem] gap-x-10 px-8 pt-8 pb-9">
            {DESKTOP_MENU_GROUPS.map((group, groupIndex) => (
              <nav key={group.title} aria-labelledby={`desktop-menu-group-${groupIndex}`}>
                <h3 id={`desktop-menu-group-${groupIndex}`} className={cn(OVERLINE, 'pb-2', TONES[group.tone])}>
                  {group.title}
                </h3>
                <ul className="m-0 list-none border-b border-line p-0">
                  {group.items.map((item, itemIndex) => (
                    <li key={item.to} className="border-t border-line">
                      <Link
                        ref={groupIndex === 0 && itemIndex === 0 ? firstLink : undefined}
                        to={item.to}
                        onClick={onClose}
                        className="flex min-h-11 flex-col gap-0.5 py-3 text-brown no-underline hover:text-brown"
                      >
                        <span className="text-item leading-[1.2] font-bold">{item.label}</span>
                        {item.description && <span className="text-small leading-[1.4] text-brown-400">{item.description}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            <div className="flex flex-col gap-4.5 bg-cream-dark px-6 py-5.5">
              {user && (
                <section aria-labelledby="desktop-menu-account" className="flex flex-col gap-1.5">
                  <h3 id="desktop-menu-account" className={cn(OVERLINE, 'text-brown-400')}>
                    Sua conta
                  </h3>
                  <Link to="/minha-conta" onClick={onClose} className="flex min-h-11 items-center font-semibold text-brown no-underline hover:text-brown">
                    Minha conta
                  </Link>
                  {user.isStaff && (
                    <Link to="/admin" onClick={onClose} className="flex min-h-11 items-center font-semibold text-brown no-underline hover:text-brown">
                      Painel da equipe
                    </Link>
                  )}
                </section>
              )}
              <section aria-labelledby="desktop-menu-contact" className="flex flex-col gap-1.5">
                <h3 id="desktop-menu-contact" className={cn(OVERLINE, 'text-brown-400')}>
                  Fale com a gente
                </h3>
                <p className="m-0 text-[1.25rem] leading-[1.2] font-bold">{CONTACTS.phoneDisplay}</p>
                <p className="m-0 text-small text-brown-600">WhatsApp, seg a sáb, 9h–18h</p>
              </section>
              <a
                href={CONTACTS.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-12 items-center justify-center bg-brown text-[0.9375rem] font-semibold text-cream no-underline hover:text-cream"
              >
                Abrir WhatsApp
              </a>
              <section aria-labelledby="desktop-menu-reading" className="flex flex-col gap-2 border-t border-line pt-4">
                <h3 id="desktop-menu-reading" ref={readingHeading} tabIndex={-1} className={cn(OVERLINE, 'text-brown-400')}>
                  Leitura
                </h3>
                <div role="group" aria-label="Tamanho do texto e contraste" className="grid grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,2fr)] gap-1.5">
                  <button
                    type="button"
                    aria-label="A−, diminuir o texto"
                    disabled={reading.fontStep <= MIN_FONT_STEP}
                    onClick={reading.decreaseFont}
                    className={cn(READING_BUTTON, 'bg-transparent disabled:opacity-50')}
                  >
                    A−
                  </button>
                  <button
                    type="button"
                    aria-label="A, texto no tamanho normal"
                    aria-pressed={reading.fontStep === 0}
                    onClick={reading.resetFont}
                    className={cn(READING_BUTTON, reading.fontStep === 0 ? 'bg-brown text-cream' : 'bg-transparent')}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    aria-label="A+, aumentar o texto"
                    disabled={reading.fontStep >= MAX_FONT_STEP}
                    onClick={reading.increaseFont}
                    className={cn(READING_BUTTON, 'bg-transparent disabled:opacity-50')}
                  >
                    A+
                  </button>
                  <button
                    type="button"
                    aria-pressed={reading.highContrast}
                    onClick={reading.toggleContrast}
                    className={cn(READING_BUTTON, 'text-[0.8125rem]', reading.highContrast ? 'bg-brown text-cream' : 'bg-transparent')}
                  >
                    {reading.highContrast && <span aria-hidden="true">✓ </span>}Alto contraste
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="flex-1 bg-scrim" />
      </div>
    </dialog>
  )
}
