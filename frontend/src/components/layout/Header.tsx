import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import { cn } from '../../lib/cn'
import { DESKTOP_NAV, SUPPORT, isActiveRoute } from '../../lib/navigation'
import { useSignOut } from '../auth/useSignOut'
import { Chevron } from '../ui/Chevron'
import { Logo } from './Logo'
import type { OpenMenu } from './Menu'

const CONTROL =
  'min-h-11 items-center justify-center rounded-control border-[1.5px] border-brown text-brown no-underline hover:text-brown cursor-pointer'
const GHOST = `${CONTROL} bg-transparent hover:bg-hover`
const SOLID = `${CONTROL} hover:brightness-95`

export function Header({ openMenu, menuOpen = false }: { openMenu: OpenMenu; menuOpen?: boolean }) {
  const { pathname } = useLocation()
  const { user, status } = useAuth()
  const signOut = useSignOut()
  const pointer = useRef({ x: -1, y: -1 })
  const lock = useRef({ x: -1, y: -1 })

  useEffect(() => {
    const track = (event: MouseEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY }
    }
    window.addEventListener('mousemove', track)
    return () => window.removeEventListener('mousemove', track)
  }, [])

  useEffect(() => {
    if (!menuOpen) lock.current = { ...pointer.current }
  }, [menuOpen])

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
                      'group relative flex min-h-11 items-center px-3.5 text-[0.9375rem] no-underline hover:text-brown',
                      active ? 'font-bold text-brown' : 'font-semibold text-brown-600',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-x-3.5 bottom-1 h-0.75 origin-left transition-transform duration-150',
                        active ? 'bg-ochre' : 'scale-x-0 bg-brown-300 group-hover:scale-x-100',
                      )}
                    />
                    {destination.label}
                  </Link>
                </li>
              )
            })}
            <li>
              <button
                type="button"
                aria-expanded={menuOpen}
                data-menu-trigger
                onMouseEnter={(event) => {
                  const parked = event.clientX === lock.current.x && event.clientY === lock.current.y
                  if (!menuOpen && !parked) openMenu('start')
                }}
                onClick={() => openMenu('start')}
                className={cn(
                  'flex min-h-11 cursor-pointer items-center gap-2 rounded-control px-3.5 text-[0.9375rem]',
                  menuOpen ? 'bg-brown font-bold text-cream' : 'bg-transparent font-semibold text-brown-600 hover:text-brown',
                )}
              >
                Mais <Chevron direction={menuOpen ? 'up' : 'down'} />
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
            className={cn(GHOST, 'inline-flex w-11 text-[0.9375rem] font-bold')}
          >
            Aa
          </button>
          {status === 'loading' ? (
            <span aria-hidden="true" className="inline-block h-11 w-20" />
          ) : user ? (
            <>
              <Link
                to="/minha-conta"
                aria-label={`Minha conta, ${user.name}`}
                className={cn(GHOST, 'inline-flex max-w-24 px-3 font-semibold text-small desktop:max-w-48 desktop:px-4 desktop:text-[0.9375rem]')}
              >
                <span className="truncate">{user.name.split(' ')[0]}</span>
              </Link>
              <button
                type="button"
                onClick={signOut}
                className={cn(GHOST, 'hidden px-4 text-[0.9375rem] font-semibold desktop:inline-flex')}
              >
                Sair
              </button>
            </>
          ) : (
            <Link
              to="/entrar"
              className={cn(GHOST, 'inline-flex px-3.5 font-semibold text-small whitespace-nowrap desktop:px-4 desktop:text-[0.9375rem]')}
            >
              Entrar
            </Link>
          )}
          <Link to={SUPPORT.to} className={cn(SOLID, 'hidden bg-ochre px-4.5 text-[0.9375rem] font-bold desktop:inline-flex')}>
            {SUPPORT.label}
          </Link>
        </div>
      </div>
    </header>
  )
}
