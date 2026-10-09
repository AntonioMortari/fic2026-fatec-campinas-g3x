import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { ADMIN_BOTTOM_BAR, isActiveAdminRoute } from '../../lib/admin-navigation'
import type { OpenMenu } from '../layout/Menu'

const LINK = 'flex min-h-11 items-center px-3.5 text-[0.9375rem] no-underline hover:text-cream'

export function AdminHeader({ openMenu }: { openMenu: OpenMenu }) {
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-30 bg-brown text-cream">
      <div className="mx-auto flex h-15 max-w-page items-center gap-3 px-4 desktop:gap-8 desktop:px-8">
        <Link to="/admin" className="flex min-h-11 items-center text-cream no-underline hover:text-cream">
          <span className="flex h-6 flex-wrap items-baseline gap-x-2 overflow-hidden">
            <span className="text-item font-bold">Painel</span>
            <span className="text-small text-cream-dim">· Ateliê Afro</span>
          </span>
        </Link>

        <nav aria-label="Painel" className="hidden flex-1 desktop:block">
          <ul className="m-0 flex list-none gap-1 p-0">
            {ADMIN_BOTTOM_BAR.map((destination) => {
              const active = isActiveAdminRoute(destination.to, pathname)
              return (
                <li key={destination.to}>
                  <Link
                    to={destination.to}
                    aria-current={active ? 'page' : undefined}
                    className={cn(LINK, active ? 'font-bold text-cream underline decoration-ochre decoration-[3px] underline-offset-8' : 'font-semibold text-cream-dim')}
                  >
                    {destination.label}
                  </Link>
                </li>
              )
            })}
            <li>
              <button type="button" onClick={() => openMenu('start')} className={cn(LINK, 'cursor-pointer bg-transparent font-semibold text-cream-dim')}>
                Mais
              </button>
            </li>
          </ul>
        </nav>

        <span className="flex-1 desktop:hidden" />

        <Link
          to="/"
          className="inline-flex min-h-11 shrink-0 items-center rounded-control border-[1.5px] border-cream px-3.5 text-small font-semibold whitespace-nowrap text-cream no-underline hover:text-cream"
        >
          Ver o site
        </Link>
      </div>
    </header>
  )
}
