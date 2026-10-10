import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { LoadingSession } from '../components/auth/LoadingSession'
import { LoginForm } from '../components/auth/LoginForm'
import { RegisterForm } from '../components/auth/RegisterForm'
import { Alert, Tabs } from '../components/ui'
import { useAuth } from '../contexts/useAuth'
import { labelForRoute } from '../lib/navigation'
import { safeRedirect } from '../lib/safe-redirect'

export function Auth() {
  const [searchParams] = useSearchParams()
  const { user, status, sessionExpired, signIn } = useAuth()
  const [active, setActive] = useState('login')
  const destination = safeRedirect(searchParams.get('voltar'))
  const destinationLabel = destination === '/' ? null : labelForRoute(destination)

  if (status === 'loading') return <LoadingSession />
  if (user) return <Navigate to={destination} replace />

  return (
    <div className="flex flex-col gap-4.5 desktop:grid desktop:grid-cols-[minmax(0,32.5rem)_minmax(0,30rem)] desktop:items-center desktop:justify-between">
      <div className="flex flex-col gap-1.5 desktop:gap-6">
        <img
          src="/images/logo.png"
          alt="Ateliê Afro Cultural"
          width={520}
          height={212}
          className="mb-3 block h-11 w-auto self-start desktop:hidden"
        />
        <p className="m-0 hidden text-[0.8125rem] font-semibold tracking-[0.12em] text-ochre-deep uppercase desktop:block">Área da conta</p>
        <h1 className="m-0 font-bold text-[1.875rem] leading-[1.1] desktop:text-[3rem] desktop:leading-[1.08]">
          Sua conta<span className="hidden desktop:inline"> no Ateliê</span>
        </h1>
        <p className="m-0 text-[0.9375rem] leading-[1.4] text-brown-600 desktop:text-[1.125rem] desktop:leading-[1.42]">
          Entre ou crie uma conta para participar do Ateliê.
          <span className="desktop:hidden"> Inscrição em evento não precisa de conta.</span>
        </p>
        <p className="m-0 hidden bg-cream-dark px-4 py-3.5 text-[0.9375rem] desktop:block">
          <strong>Só quer ir a um evento?</strong> Inscrição não precisa de conta. <Link to="/agenda" className="relative before:absolute before:-inset-y-3.5 before:inset-x-0 before:content-['']">
            Ver a agenda
          </Link>
        </p>
      </div>

      <div className="flex flex-col gap-4.5 desktop:border desktop:border-brown desktop:bg-card desktop:p-9 desktop:shadow-applique-hero-desktop">
        {sessionExpired && <Alert tone="info">Sua sessão terminou. Entre de novo para continuar.</Alert>}

        <Tabs
          label="Entrar ou criar conta"
          activeId={active}
          onChange={setActive}
          tabs={[
            { id: 'login', label: 'Entrar', content: <LoginForm onSuccess={signIn} /> },
            { id: 'register', label: 'Criar conta', content: <RegisterForm onSuccess={signIn} /> },
          ]}
        />

        {destinationLabel && (
          <p className="m-0 mt-1.5 border border-line bg-card px-4 py-3.5 text-[0.90625rem] desktop:mt-0 desktop:border-0 desktop:bg-transparent desktop:p-0 desktop:text-center desktop:text-small desktop:text-brown-400">
            Depois de entrar, você volta para <strong className="text-brown">{destinationLabel}</strong>.
          </p>
        )}
      </div>
    </div>
  )
}
