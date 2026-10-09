import { Link, Outlet, useMatches, useSearchParams } from 'react-router-dom'
import { labelForRoute } from '../../lib/navigation'
import { safeRedirect } from '../../lib/safe-redirect'
import { Chevron } from '../ui/Chevron'
import type { RouteHandle } from './Layout'
import { SkipLink } from './SkipLink'
import { useRouteFocus } from './useRouteFocus'

export function FocusedLayout() {
  const [searchParams] = useSearchParams()
  const defaultBack = useMatches()
    .map((match) => (match.handle as RouteHandle | undefined)?.backTo)
    .findLast(Boolean)
  const back = safeRedirect(searchParams.get('voltar'), defaultBack ?? '/')
  const backLabel = back === '/' ? null : labelForRoute(back)
  useRouteFocus()

  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <header className="border-b border-line">
        <div className="mx-auto flex h-15 max-w-xl items-center px-1">
          <Link
            to={back}
            className="flex min-h-11 items-center gap-2 px-3 text-[0.9375rem] font-semibold text-brown no-underline hover:text-brown"
          >
            <Chevron direction="left" />
            {backLabel ?? 'Voltar'}
          </Link>
        </div>
      </header>
      <main id="content" tabIndex={-1} className="mx-auto w-full max-w-xl flex-1 px-4 pt-7 pb-10 outline-none">
        <Outlet />
      </main>
    </div>
  )
}
