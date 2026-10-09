import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        <img src="/images/logo.png" alt="Ateliê Afro Cultural" width={520} height={212} className="block h-12 w-auto self-start" />
        <h1 className="m-0 text-h1 font-bold">Sua conta</h1>
        <p className="m-0 text-body text-brown-600">Entre ou crie uma conta para participar do Ateliê.</p>
      </div>

      {sessionExpired && <Alert tone="info">Sua sessão terminou. Entre de novo para continuar.</Alert>}

      {destinationLabel && (
        <p className="m-0 border-[1.5px] border-dashed border-brown-300 px-3.5 py-2.5 text-[0.9375rem]">
          Depois de entrar, você volta para <strong>{destinationLabel}</strong>.
        </p>
      )}

      <Tabs
        label="Entrar ou criar conta"
        activeId={active}
        onChange={setActive}
        tabs={[
          { id: 'login', label: 'Entrar', content: <LoginForm onSuccess={signIn} /> },
          { id: 'register', label: 'Criar conta', content: <RegisterForm onSuccess={signIn} /> },
        ]}
      />
    </div>
  )
}
