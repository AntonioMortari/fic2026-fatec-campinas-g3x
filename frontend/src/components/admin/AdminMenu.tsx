import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ADMIN_MORE_GROUPS } from '../../lib/admin-navigation'
import { useSignOut } from '../auth/useSignOut'
import { ReadingControls } from '../layout/ReadingControls'

const OVERLINE = 'm-0 mt-6 mb-0.5 text-overline font-semibold uppercase tracking-[0.12em] text-ochre-deep'
const ROW = 'flex min-h-12.5 items-center text-body font-semibold text-brown no-underline hover:text-blue-deep'

interface AdminMenuProps {
  open: boolean
  onClose: () => void
  bottomBar: ReactNode
}

// "Mais" of the phone panel (design 10e): the same sheet as the public menu, with the panel's own screens.
export function AdminMenu({ open, onClose, bottomBar }: AdminMenuProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const signOut = useSignOut()

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) element.showModal()
    else if (!open && element.open) element.close()
  }, [open])

  return (
    <dialog
      ref={dialog}
      aria-labelledby="admin-menu-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className="m-0 mt-auto h-[calc(100dvh-4rem)] max-h-none w-full max-w-none border-0 border-t border-brown bg-card p-0 text-brown backdrop:bg-scrim open:animate-sheet desktop:hidden"
    >
      <div className="flex h-full flex-col">
        <div aria-hidden="true" className="flex justify-center pt-2.5 pb-1">
          <span className="h-1 w-11 rounded-sm bg-cream-dim" />
        </div>
        <div className="flex items-center justify-between px-4 pt-1 pb-2">
          <h2 id="admin-menu-title" className="m-0 text-[1.375rem] leading-[1.2] font-bold">
            Painel
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar o menu"
            className="grid size-11 cursor-pointer place-items-center rounded-control border border-brown bg-transparent text-xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-24">
          <nav aria-label="Todas as telas do painel">
            {ADMIN_MORE_GROUPS.map((group) => (
              <section key={group.title} aria-label={group.title}>
                <h3 className={OVERLINE}>{group.title}</h3>
                <ul className="m-0 list-none p-0">
                  {group.items.map((item) => (
                    <li key={item.to} className="border-b border-line">
                      <Link to={item.to} onClick={onClose} className={ROW}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </nav>

          <h3 className={OVERLINE}>Leitura</h3>
          <div className="mt-2">
            <ReadingControls />
          </div>

          <div className="mt-6 grid grid-cols-2 items-center gap-2">
            <Link
              to="/"
              onClick={onClose}
              className="flex min-h-12 items-center justify-center rounded-control border border-brown text-[0.9375rem] font-semibold text-brown no-underline hover:bg-hover hover:text-brown"
            >
              Ver o site
            </Link>
            <button
              type="button"
              onClick={() => {
                onClose()
                signOut()
              }}
              className="min-h-12 cursor-pointer bg-transparent text-[0.9375rem] font-semibold text-blue-deep hover:text-brown"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
      {bottomBar}
    </dialog>
  )
}
