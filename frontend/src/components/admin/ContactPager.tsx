import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import type { ContactPagination } from '../../types/contacts'

interface ContactPagerProps {
  pagination: ContactPagination
  hrefFor: (page: number) => string
}

const STEP = 'inline-flex min-h-11 items-center px-2 text-small font-semibold'

export function ContactPager({ pagination, hrefFor }: ContactPagerProps) {
  const { page, totalPages } = pagination

  return (
    <nav aria-label="Páginas da fila" className="flex items-center justify-between gap-3">
      <p className="m-0 text-small text-brown-600" aria-current="page">
        Página {page} de {totalPages}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link to={hrefFor(page - 1)} className={cn(STEP, 'text-blue-deep')}>
            <span aria-hidden="true">← </span>Anteriores
          </Link>
        ) : (
          <span aria-disabled="true" className={cn(STEP, 'text-brown-300')}>
            <span aria-hidden="true">← </span>Anteriores
          </span>
        )}
        {page < totalPages ? (
          <Link to={hrefFor(page + 1)} className={cn(STEP, 'text-blue-deep')}>
            Próximas<span aria-hidden="true"> →</span>
          </Link>
        ) : (
          <span aria-disabled="true" className={cn(STEP, 'text-brown-300')}>
            Próximas<span aria-hidden="true"> →</span>
          </span>
        )}
      </div>
    </nav>
  )
}
