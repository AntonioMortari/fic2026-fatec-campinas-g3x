import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { ADMIN_BOTTOM_BAR, isActiveAdminRoute } from '../../lib/admin-navigation'

const ITEM = 'relative flex min-h-16 items-center justify-center text-[min(0.8125rem,15px)] no-underline'

function ActiveMarker() {
  return <span aria-hidden="true" className="absolute inset-x-[22%] -top-px h-1 bg-ochre" />
}

interface AdminBottomBarProps {
  openMenu: () => void
  menuOpen: boolean
  onCloseMenu?: () => void
}

export function AdminBottomBar({ openMenu, menuOpen, onCloseMenu }: AdminBottomBarProps) {
  const { pathname } = useLocation()

  return (
    <nav aria-label="Atalhos do painel" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream px-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] desktop:hidden print:hidden">
      <ul className="m-0 grid list-none grid-cols-3 p-0">
        {ADMIN_BOTTOM_BAR.map((destination) => {
          const active = !menuOpen && isActiveAdminRoute(destination.to, pathname)
          return (
            <li key={destination.to}>
              <Link
                to={destination.to}
                onClick={onCloseMenu}
                aria-current={active ? 'page' : undefined}
                className={cn(ITEM, active ? 'font-bold text-brown' : 'font-semibold text-brown-400', 'hover:text-blue-deep')}
              >
                {active && <ActiveMarker />}
                {destination.label}
              </Link>
            </li>
          )
        })}
        <li>
          <button
            type="button"
            aria-expanded={menuOpen}
            onClick={menuOpen && onCloseMenu ? onCloseMenu : openMenu}
            className={cn(ITEM, 'w-full cursor-pointer bg-transparent', menuOpen ? 'font-bold text-brown' : 'font-semibold text-brown-400')}
          >
            {menuOpen && <ActiveMarker />}
            Mais
          </button>
        </li>
      </ul>
    </nav>
  )
}
