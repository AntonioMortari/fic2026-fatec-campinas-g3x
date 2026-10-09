import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MAX_FONT_STEP, MIN_FONT_STEP } from '../../contexts/reading-context'
import { useReadingPreferences } from '../../contexts/useReadingPreferences'
import { cn } from '../../lib/cn'
import { CONTACTS } from '../../lib/contacts'
import { MENU_GROUPS } from '../../lib/navigation'

export type MenuSection = 'start' | 'reading'
export type OpenMenu = (section: MenuSection) => void

const TONES = { ochre: 'text-ochre-deep', blue: 'text-blue-deep', brown: 'text-brown-400' }
const OVERLINE = 'm-0 text-overline font-semibold uppercase tracking-[0.12em]'
const READING_BUTTON =
  'grid min-h-11 cursor-pointer place-items-center rounded-control border-[1.5px] border-brown px-2 text-small font-semibold'

interface MenuProps {
  open: boolean
  section: MenuSection
  onClose: () => void
  bottomBar?: ReactNode
}

export function Menu({ open, section, onClose, bottomBar }: MenuProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const readingHeading = useRef<HTMLHeadingElement>(null)
  const reading = useReadingPreferences()

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) {
      element.showModal()
      if (section === 'reading') {
        readingHeading.current?.scrollIntoView({ block: 'start' })
        readingHeading.current?.focus()
      }
    } else if (!open && element.open) {
      element.close()
    }
  }, [open, section])

  return (
    <dialog
      ref={dialog}
      aria-labelledby="menu-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className={cn(
        'm-0 mt-auto h-[calc(100dvh-4rem)] max-h-none w-full max-w-none border-0 border-t-[1.5px] border-brown bg-card p-0 text-brown',
        'backdrop:bg-scrim open:animate-sheet',
        'desktop:mx-auto desktop:max-w-xl desktop:border-x-[1.5px]',
      )}
    >
      <div className="flex h-full flex-col">
        <div aria-hidden="true" className="flex justify-center pt-2.5 pb-1">
          <span className="h-1 w-11 rounded-sm bg-cream-dim" />
        </div>
        <div className="flex items-center justify-between px-4 pt-1 pb-2">
          <h2 id="menu-title" className="m-0 text-h2 font-bold">
            Menu
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar o menu"
            className="grid size-11 cursor-pointer place-items-center rounded-control border-[1.5px] border-brown bg-transparent text-xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-24 desktop:pb-8">
          <nav aria-label="Todas as páginas">
            {MENU_GROUPS.map((group, index) => (
              <section key={group.title} aria-labelledby={`menu-group-${index}`}>
                <h3 id={`menu-group-${index}`} className={cn(OVERLINE, index === 0 ? 'mt-3.5' : 'mt-5', 'mb-0.5', TONES[group.tone])}>
                  {group.title}
                </h3>
                <ul className="m-0 list-none p-0">
                  {group.items.map((item) => (
                    <li key={item.to} className="border-b border-line">
                      <Link
                        to={item.to}
                        onClick={onClose}
                        className="flex min-h-13 items-center text-item font-semibold text-brown no-underline hover:text-brown"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </nav>

          <h3 className={cn(OVERLINE, 'mt-6 mb-2.5 text-brown-400')}>Fale com a gente</h3>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={CONTACTS.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-12 items-center justify-center bg-brown text-[0.9375rem] font-semibold text-cream no-underline hover:text-cream"
            >
              WhatsApp
            </a>
            <Link
              to="/contato"
              onClick={onClose}
              className="flex min-h-12 items-center justify-center border-[1.5px] border-brown text-[0.9375rem] font-semibold text-brown no-underline hover:text-brown"
            >
              Contato
            </Link>
          </div>

          <h3 ref={readingHeading} tabIndex={-1} className={cn(OVERLINE, 'mt-6 mb-2.5 scroll-mt-4 text-brown-400')}>
            Leitura
          </h3>
          <div role="group" aria-label="Tamanho do texto e contraste" className="grid grid-cols-[repeat(3,1fr)_1.6fr] gap-2">
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
              className={cn(READING_BUTTON, reading.highContrast ? 'bg-brown text-cream' : 'bg-transparent')}
            >
              {reading.highContrast && <span aria-hidden="true">✓ </span>}Alto contraste
            </button>
          </div>
        </div>
      </div>
      {bottomBar}
    </dialog>
  )
}
