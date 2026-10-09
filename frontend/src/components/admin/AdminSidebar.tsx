import { Link, useLocation } from 'react-router-dom'
import { ADMIN_SIDEBAR, isActiveAdminRoute } from '../../lib/admin-navigation'
import { cn } from '../../lib/cn'

export function AdminSidebar() {
  const { pathname } = useLocation()

  return (
    <nav aria-label="Seções do painel" className="sticky top-18 hidden h-[calc(100dvh-4.5rem)] flex-col self-start border-r border-line py-6 desktop:flex">
      <ul className="m-0 flex list-none flex-col p-0">
        {ADMIN_SIDEBAR.map((destination) => {
          const active = isActiveAdminRoute(destination.to, pathname)
          return (
            <li key={destination.to}>
              <Link
                to={destination.to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center text-[0.9375rem] no-underline hover:text-brown',
                  active ? 'border-l-[3px] border-ochre bg-cream-dark pr-6 pl-[21px] font-bold text-brown' : 'px-6 font-semibold text-brown',
                )}
              >
                {destination.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
