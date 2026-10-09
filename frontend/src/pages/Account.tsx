import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MyRegistrations } from '../components/account/MyRegistrations'
import { useSignOut } from '../components/auth/useSignOut'
import { Alert, Button, Card, Container, EmptyState, PageHeader } from '../components/ui'
import { CONTACTS } from '../lib/contacts'
import { formatPhone } from '../lib/format-phone'
import { PERSON_TYPE_SHORT_LABELS } from '../lib/person-type'
import { useMe, type AuthUser } from '../services/auth'

function Ficha({ user }: { user: AuthUser }) {
  const rows: [string, string][] = [
    ['Nome', user.name],
    ['Telefone', user.phone ? formatPhone(user.phone) : 'Não informado'],
    ['Tipo', PERSON_TYPE_SHORT_LABELS[user.personType]],
  ]

  return (
    <Card elevation="outline" as="section" aria-label="Seus dados">
      <dl className="m-0 flex flex-col">
        {rows.map(([term, value]) => (
          <div key={term} className="flex flex-col gap-0.5 border-b border-line px-4 py-3">
            <dt className="text-small text-brown-400">{term}</dt>
            <dd className="m-0 text-body font-semibold break-words">{value}</dd>
          </div>
        ))}
        <div className="flex flex-col gap-0.5 px-4 py-3">
          <dt className="text-small text-brown-400">E-mail</dt>
          <dd className="m-0 text-body font-semibold break-words">{user.email}</dd>
          <dd className="m-0 text-small text-brown-400">
            Para trocar o e-mail, fale com a gente pelo <a href={CONTACTS.whatsapp}>WhatsApp</a>.
          </dd>
        </div>
      </dl>
    </Card>
  )
}

export function Account() {
  const me = useMe()
  const signOut = useSignOut()
  const location = useLocation()
  const navigate = useNavigate()
  const updated = (location.state as { updated?: boolean } | null)?.updated === true

  // The notice belongs to the redirect that brought the person here: reloading the page must not bring it back.
  useEffect(() => {
    if (updated) void navigate(location.pathname, { replace: true, state: null })
  }, [updated, navigate, location.pathname])

  return (
    <Container className="pb-12">
      {updated && (
        <Alert tone="info" className="mt-4">
          Seus dados foram atualizados.
        </Alert>
      )}
      <PageHeader overline="Área da conta" title="Sua conta" lead="Só você e a equipe do Ateliê enxergam esta página." />
      <div className="flex max-w-xl flex-col gap-5">
        {me.isPending && <p role="status" className="m-0">Carregando seus dados…</p>}
        {me.isError && (
          <EmptyState
            tone="error"
            title="Não conseguimos carregar seus dados"
            text="Tente de novo em alguns minutos."
            actions={
              <Button variant="secondary" size="compact" onClick={() => void me.refetch()}>
                Tentar de novo
              </Button>
            }
          />
        )}
        {me.data && <Ficha user={me.data} />}
        {me.data && (
          <Button to="/minha-conta/dados" variant="secondary">
            Alterar meus dados
          </Button>
        )}
        {me.data && (
          <section aria-labelledby="participations" className="flex flex-col gap-3 pt-2">
            <h2 id="participations" className="m-0 text-overline font-semibold uppercase tracking-[0.12em] text-brown-400">
              Minhas participações
            </h2>
            <MyRegistrations />
          </section>
        )}
        <Button variant="secondary" onClick={signOut} className="self-start">
          Sair da conta
        </Button>
      </div>
    </Container>
  )
}
