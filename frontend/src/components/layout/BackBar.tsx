import { Link } from 'react-router-dom'
import { BackLink } from '../ui/BackLink'
import { Chevron } from '../ui/Chevron'
import { Container } from '../ui/Container'

interface BackBarProps {
  to: string
  label: string
  onDesktop?: boolean
}

export function BackBar({ to, label, onDesktop = true }: BackBarProps) {
  return (
    <>
      <div className="border-b border-line desktop:hidden">
        <div className="mx-auto flex h-15 max-w-xl items-center px-1">
          <Link to={to} className="flex min-h-11 items-center gap-2 px-3 text-[0.9375rem] font-semibold text-brown no-underline hover:text-blue-deep">
            <Chevron direction="left" />
            <span>
              <span className="sr-only">Voltar para</span> {label}
            </span>
          </Link>
        </div>
      </div>
      {onDesktop && (
        <Container className="hidden pt-8 desktop:block">
          <BackLink to={to} label={label} tone="link" />
        </Container>
      )}
    </>
  )
}
