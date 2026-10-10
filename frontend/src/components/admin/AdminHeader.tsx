import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import { cn } from '../../lib/cn'

export function AdminHeader({ hideOnMobile }: { hideOnMobile: boolean }) {
  const { user } = useAuth()

  return (
    <header className={cn('sticky top-0 z-30 border-b border-line bg-cream print:hidden', hideOnMobile && 'max-desktop:hidden')}>
      <div className="mx-auto flex h-15 max-w-page items-center gap-3 px-4 desktop:h-18 desktop:max-w-none desktop:px-8">
        <Link to="/admin" className="flex min-h-11 items-center gap-2.5 text-brown no-underline hover:text-brown desktop:gap-3.5">
          <img src="/images/logo.png" alt="" width={520} height={212} className="block h-8 w-auto desktop:h-9.5" />
          <span className="border border-brown px-1.75 py-0.5 text-[0.625rem] leading-[1.2] font-bold tracking-[0.1em] uppercase desktop:px-2 desktop:py-[3px] desktop:text-[0.6875rem]">
            Painel
          </span>
        </Link>

        <span className="flex-1" />

        {user && (
          <Link
            to="/minha-conta"
            aria-label={`Minha conta, ${user.name}`}
            className="hidden min-h-11 max-w-56 items-center text-[0.9375rem] font-semibold text-brown no-underline hover:text-blue-deep desktop:inline-flex"
          >
            <span className="truncate">{user.name}</span>
          </Link>
        )}
        <Link
          to="/"
          className="hidden min-h-11 shrink-0 items-center text-[0.9375rem] font-semibold whitespace-nowrap text-blue-deep no-underline hover:text-brown desktop:inline-flex"
        >
          Ver o site
        </Link>
      </div>
    </header>
  )
}
