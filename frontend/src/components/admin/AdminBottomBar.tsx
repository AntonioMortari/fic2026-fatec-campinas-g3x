import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { ADMIN_BOTTOM_BAR, isActiveAdminRoute } from '../../lib/admin-navigation'
import type { OpenMenu } from '../layout/Menu'

const ITEM = 'relative flex min-h-14 items-center justify-center text-[min(0.8125rem,15px)] no-underline'

function ActiveMarker() {
  return <span aria-hidden="true" className="absolute inset-x-[22%] -top-[1.5px] h-1 bg-ochre" />
}

interface AdminBottomBarProps {
  openMenu: OpenMenu
  menuOpen: boolean
  onCloseMenu?: () => void
}

export function AdminBottomBar({ openMenu, menuOpen, onCloseMenu }: AdminBottomBarProps) {
  const { pathname } = useLocation()

  return (
    <nav aria-label="Atalhos do painel" className="safe-area-bottom fixed inset-x-0 bottom-0 z-30 border-t-[1.5px] border-brown bg-card px-1.5 desktop:hidden print:hidden">
      <ul className="m-0 grid list-none grid-cols-3 p-0">
        {ADMIN_BOTTOM_BAR.map((destination) => {
          const active = !menuOpen && isActiveAdminRoute(destination.to, pathname)
          return (
            <li key={destination.to}>
              <Link
                to={destination.to}
                onClick={onCloseMenu}
                aria-current={active ? 'page' : undefined}
                className={cn(ITEM, active ? 'font-bold text-brown' : 'font-semibold text-brown-400', 'hover:text-brown')}
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
            onClick={menuOpen && onCloseMenu ? onCloseMenu : () => openMenu('start')}
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
