import { Link, Outlet, useMatches, useSearchParams } from 'react-router-dom'
import { CONTACTS } from '../../lib/contacts'
import { cn } from '../../lib/cn'
import { labelForRoute } from '../../lib/navigation'
import { safeRedirect } from '../../lib/safe-redirect'
import { Chevron } from '../ui/Chevron'
import type { RouteHandle } from './Layout'
import { Logo } from './Logo'
import { SkipLink } from './SkipLink'
import { useRouteFocus } from './useRouteFocus'

export function FocusedLayout() {
  const [searchParams] = useSearchParams()
  const handles = useMatches().map((match) => match.handle as RouteHandle | undefined)
  const defaultBack = handles.map((handle) => handle?.backTo).findLast(Boolean)
  const wide = handles.some((handle) => handle?.wide)
  const genericBack = handles.some((handle) => handle?.genericBack)
  const back = safeRedirect(searchParams.get('voltar'), defaultBack ?? '/')
  const backLabel = back === '/' ? null : labelForRoute(back)
  useRouteFocus()

  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <header className="border-b border-line">
        <div className="mx-auto flex h-15 max-w-xl items-center px-1 desktop:h-19 desktop:max-w-page desktop:justify-between desktop:px-8">
          <div className="hidden desktop:flex">
            <Logo className="h-11" />
          </div>
          <Link
            to={back}
            className="flex min-h-11 items-center gap-2 px-3 text-[0.9375rem] font-semibold text-brown no-underline hover:text-brown desktop:-mr-3"
          >
            <Chevron direction="left" />
            <span>
              {!backLabel && 'Voltar'}
              {backLabel && genericBack && (
                <>
                  Voltar <span className="hidden desktop:inline">para {backLabel}</span>
                </>
              )}
              {backLabel && !genericBack && (
                <>
                  <span className="hidden desktop:inline">Voltar para</span> {backLabel}
                </>
              )}
            </span>
          </Link>
        </div>
      </header>
      <main
        id="content"
        tabIndex={-1}
        className={cn(
          'mx-auto w-full flex-1 px-4 pt-7 pb-10 outline-none',
          wide ? 'max-w-xl desktop:flex desktop:max-w-page desktop:items-center desktop:px-8 desktop:py-10' : 'max-w-xl',
        )}
      >
        <div className="w-full">
          <Outlet />
        </div>
      </main>
      <footer className="hidden border-t border-line desktop:block">
        <div className="mx-auto flex h-14 max-w-page items-center justify-between px-8 text-small text-brown-400">
          <p className="m-0">Ateliê Afro Cultural · Casa Verde, São Paulo</p>
          <ul className="m-0 flex list-none gap-6 p-0">
            <li>
              <Link to="/privacidade" className="inline-flex min-h-11 items-center text-brown-400 no-underline hover:text-brown">
                Privacidade
              </Link>
            </li>
            <li>
              <a href={CONTACTS.whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-brown-400 no-underline hover:text-brown">
                WhatsApp {CONTACTS.phoneDisplay}
              </a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  )
}
