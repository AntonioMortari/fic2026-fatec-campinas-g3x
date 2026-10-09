import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import { cn } from '../../lib/cn'

export function AdminHeader({ hideOnMobile }: { hideOnMobile: boolean }) {
  const { user } = useAuth()

  return (
    <header
      className={cn(
        'sticky top-0 z-30 bg-brown text-cream print:hidden desktop:border-b desktop:border-line desktop:bg-cream desktop:text-brown',
        hideOnMobile && 'max-desktop:hidden',
      )}
    >
      <div className="mx-auto flex h-15 max-w-page items-center gap-3 px-4 desktop:h-18 desktop:max-w-none desktop:px-8">
        <Link to="/admin" className="flex min-h-11 items-center gap-3.5 text-cream no-underline hover:text-cream desktop:text-brown desktop:hover:text-brown">
          <img
            src="/images/logo.png"
            alt=""
            width={520}
            height={212}
            className="hidden h-9.5 w-auto desktop:block"
          />
          <span className="flex h-6 flex-wrap items-baseline gap-x-2 overflow-hidden desktop:h-auto desktop:overflow-visible">
            <span className="text-item font-bold desktop:border-[1.5px] desktop:border-brown desktop:px-2 desktop:py-0.5 desktop:text-[0.6875rem] desktop:tracking-[0.1em] desktop:uppercase">
              Painel
            </span>
            <span className="text-small text-cream-dim desktop:hidden">· Ateliê Afro</span>
          </span>
        </Link>

        <span className="flex-1" />

        {user && (
          <Link
            to="/minha-conta"
            aria-label={`Minha conta, ${user.name}`}
            className="hidden min-h-11 items-center text-[0.9375rem] font-semibold text-brown no-underline hover:text-brown desktop:inline-flex"
          >
            {user.name.split(' ')[0]}
          </Link>
        )}
        <Link
          to="/"
          className={cn(
            'inline-flex min-h-11 shrink-0 items-center rounded-control border-[1.5px] border-cream px-3.5 text-small font-semibold whitespace-nowrap text-cream no-underline hover:text-cream',
            'desktop:rounded-none desktop:border-0 desktop:px-0 desktop:text-[0.9375rem] desktop:text-blue-deep desktop:hover:text-brown',
          )}
        >
          Ver o site
        </Link>
      </div>
    </header>
  )
}
