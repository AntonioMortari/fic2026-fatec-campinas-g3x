import { Link, Outlet, useSearchParams } from 'react-router-dom'
import { safeRedirect } from '../../lib/safe-redirect'
import { Chevron } from '../ui/Chevron'
import { SkipLink } from './SkipLink'
import { useRouteFocus } from './useRouteFocus'

export function FocusedLayout() {
  const [searchParams] = useSearchParams()
  const back = safeRedirect(searchParams.get('voltar'))
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
            Voltar
          </Link>
        </div>
      </header>
      <main id="content" tabIndex={-1} className="mx-auto w-full max-w-xl flex-1 px-4 pt-7 pb-10 outline-none">
        <Outlet />
      </main>
    </div>
  )
}
