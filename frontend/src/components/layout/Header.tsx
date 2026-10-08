import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { DESKTOP_NAV, SUPPORT, isActiveRoute } from '../../lib/navigation'
import { Chevron } from '../ui/Chevron'
import { Logo } from './Logo'
import type { OpenMenu } from './Menu'

const CONTROL =
  'min-h-11 items-center justify-center rounded-control border-[1.5px] border-brown font-semibold text-brown no-underline hover:text-brown cursor-pointer'

export function Header({ openMenu }: { openMenu: OpenMenu }) {
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream">
      <div className="mx-auto flex h-15 max-w-page items-center gap-2.5 px-4 desktop:h-19 desktop:gap-8 desktop:px-8">
        <Logo className="min-w-0 desktop:h-11" />

        <nav aria-label="Principal" className="hidden flex-1 desktop:block">
          <ul className="m-0 flex list-none gap-1 p-0">
            {DESKTOP_NAV.map((destination) => {
              const active = isActiveRoute(destination.to, pathname)
              return (
                <li key={destination.to}>
                  <Link
                    to={destination.to}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex min-h-11 items-center px-3.5 text-[0.9375rem] no-underline hover:text-brown',
                      active ? 'font-bold text-brown' : 'font-semibold text-brown-600',
                    )}
                  >
                    {active && <span aria-hidden="true" className="absolute inset-x-3.5 bottom-1 h-0.75 bg-ochre" />}
                    {destination.label}
                  </Link>
                </li>
              )
            })}
            <li>
              <button
                type="button"
                onClick={() => openMenu('start')}
                className="flex min-h-11 cursor-pointer items-center gap-2 bg-transparent px-3.5 text-[0.9375rem] font-semibold text-brown-600"
              >
                Mais <Chevron direction="down" />
              </button>
            </li>
          </ul>
        </nav>

        <span className="flex-1 desktop:hidden" />

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label="Aa, acessibilidade: tamanho do texto e contraste"
            onClick={() => openMenu('reading')}
            className={cn(CONTROL, 'inline-flex w-11 bg-transparent text-[0.9375rem] font-bold')}
          >
            Aa
          </button>
          <Link
            to="/entrar"
            className={cn(CONTROL, 'inline-flex px-3.5 text-small whitespace-nowrap desktop:px-4 desktop:text-[0.9375rem]')}
          >
            Entrar
          </Link>
          <Link to={SUPPORT.to} className={cn(CONTROL, 'hidden bg-ochre px-4.5 text-[0.9375rem] font-bold desktop:inline-flex')}>
            {SUPPORT.label}
          </Link>
        </div>
      </div>
    </header>
  )
}
