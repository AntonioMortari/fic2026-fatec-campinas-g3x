import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { ADMIN_BOTTOM_BAR, isActiveAdminRoute, isMoreRoute } from '../../lib/admin-navigation'
import { SlidingMarker } from '../layout/SlidingMarker'

const ITEM =
  'relative flex min-h-16 items-center justify-center text-[min(0.8125rem,15px)] no-underline transition-[color,transform] duration-(--motion-touch) active:scale-[.94]'

interface AdminBottomBarProps {
  openMenu: () => void
  menuOpen: boolean
  onCloseMenu?: () => void
}

export function AdminBottomBar({ openMenu, menuOpen, onCloseMenu }: AdminBottomBarProps) {
  const { pathname } = useLocation()
  const moreActive = menuOpen || isMoreRoute(pathname)
  const currentIndex = moreActive ? ADMIN_BOTTOM_BAR.length : ADMIN_BOTTOM_BAR.findIndex((destination) => isActiveAdminRoute(destination.to, pathname))

  return (
    <nav aria-label="Atalhos do painel" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream px-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] desktop:hidden print:hidden">
      <ul className="relative m-0 grid list-none grid-cols-3 p-0">
        <SlidingMarker index={currentIndex} count={3} className="-top-px" />
        {ADMIN_BOTTOM_BAR.map((destination) => {
          const active = !moreActive && isActiveAdminRoute(destination.to, pathname)
          return (
            <li key={destination.to}>
              <Link
                to={destination.to}
                onClick={onCloseMenu}
                aria-current={active ? 'page' : undefined}
                className={cn(ITEM, active ? 'font-bold text-brown' : 'font-semibold text-brown-400', 'hover:text-blue-deep')}
              >
                {destination.label}
              </Link>
            </li>
          )
        })}
        <li>
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-current={!menuOpen && moreActive ? 'page' : undefined}
            onClick={menuOpen && onCloseMenu ? onCloseMenu : openMenu}
            className={cn(ITEM, 'w-full cursor-pointer bg-transparent', moreActive ? 'font-bold text-brown' : 'font-semibold text-brown-400')}
          >
            Mais
          </button>
        </li>
      </ul>
    </nav>
  )
}
