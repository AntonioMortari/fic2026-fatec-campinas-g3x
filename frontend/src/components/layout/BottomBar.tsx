import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { BOTTOM_BAR, SUPPORT, isActiveRoute, isMenuRoute } from '../../lib/navigation'
import type { OpenMenu } from './Menu'
import { SlidingMarker } from './SlidingMarker'

// Labels stop growing at 15px: with five columns at 320px, larger text made "Projetos" touch "Apoiar".
const ITEM = 'relative flex min-h-14 items-center justify-center text-[min(0.8125rem,15px)] no-underline transition-[color,transform,scale] duration-(--motion-touch) active:scale-[.94]'

interface BottomBarProps {
  openMenu: OpenMenu
  menuOpen: boolean
  onCloseMenu?: () => void
}

export function BottomBar({ openMenu, menuOpen, onCloseMenu }: BottomBarProps) {
  const { pathname } = useLocation()
  const menuIsCurrent = menuOpen || isMenuRoute(pathname, [...BOTTOM_BAR, SUPPORT])
  const currentIndex = menuIsCurrent ? BOTTOM_BAR.length + 1 : BOTTOM_BAR.findIndex((destination) => isActiveRoute(destination.to, pathname))

  return (
    <nav aria-label="Atalhos" className="safe-area-bottom fixed inset-x-0 bottom-0 z-30 border-t-[1.5px] border-brown bg-card px-1.5 desktop:hidden">
      <ul className="relative m-0 grid list-none grid-cols-5 p-0">
        <SlidingMarker index={currentIndex} count={5} />
        {BOTTOM_BAR.map((destination) => {
          const active = !menuOpen && isActiveRoute(destination.to, pathname)
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
          <Link
            to={SUPPORT.to}
            onClick={onCloseMenu}
            aria-current={!menuOpen && isActiveRoute(SUPPORT.to, pathname) ? 'page' : undefined}
            className={ITEM}
          >
            <span className="rounded-control bg-ochre px-2 py-1.75 font-bold text-brown transition-[filter] hover:brightness-95">{SUPPORT.label}</span>
          </Link>
        </li>
        <li>
          <button
            type="button"
            aria-expanded={menuOpen}
            onClick={menuOpen && onCloseMenu ? onCloseMenu : () => openMenu('start')}
            className={cn(ITEM, 'w-full cursor-pointer bg-transparent', menuIsCurrent ? 'font-bold text-brown' : 'font-semibold text-brown-400')}
          >
            Menu
          </button>
        </li>
      </ul>
    </nav>
  )
}
