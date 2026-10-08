import { Link } from 'react-router-dom'
import { classes } from '../../compartilhado/classes'

/** Logotipo real da ONG (enviado por ela), sempre levando ao início. */
export function Logotipo({ className }: { className?: string }) {
  return (
    <Link to="/" className="inline-flex min-h-11 shrink-0 items-center">
      <img
        src="/imagens/logo-atelie.png"
        alt="Ateliê Afro Cultural — início"
        width={520}
        height={212}
        className={classes('block h-8.5 w-auto', className)}
      />
    </Link>
  )
}
