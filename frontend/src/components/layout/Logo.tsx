import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className="inline-flex min-h-11 shrink-0 items-center">
      <img
        src="/images/logo.png"
        alt="Ateliê Afro Cultural — início"
        width={520}
        height={212}
        className={cn('block h-8.5 w-auto', className)}
      />
    </Link>
  )
}
