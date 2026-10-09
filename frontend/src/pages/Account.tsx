import { useSignOut } from '../components/auth/useSignOut'
import { Button, Card, Container, EmptyState, PageHeader } from '../components/ui'
import { formatPhone } from '../lib/format-phone'
import { PERSON_TYPE_LABELS } from '../lib/person-type'
import { useMe, type AuthUser } from '../services/auth'

function participation(user: AuthUser): string {
  const parts = [user.wantsToVolunteer && 'Voluntariado', user.wantsToDonate && 'Doação e apoio'].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : 'Nenhuma'
}

function Ficha({ user }: { user: AuthUser }) {
  const rows: [string, string][] = [
    ['Nome', user.name],
    ['E-mail', user.email],
    ['Telefone', user.phone ? formatPhone(user.phone) : 'Não informado'],
    ['Conta de', PERSON_TYPE_LABELS[user.personType]],
    ['Participação', participation(user)],
  ]

  return (
    <Card elevation="outline" className="p-4.5">
      <dl className="m-0 grid gap-3.5">
        {rows.map(([term, value]) => (
          <div key={term} className="flex flex-col gap-0.5">
            <dt className="text-small font-semibold text-brown-400">{term}</dt>
            <dd className="m-0 text-body break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

export function Account() {
  const me = useMe()
  const signOut = useSignOut()

  return (
    <Container className="pb-12">
      <PageHeader overline="Sua conta" title="Minha conta" />
      <div className="flex max-w-xl flex-col gap-5">
        {me.isPending && <p role="status" className="m-0">Carregando seus dados…</p>}
        {me.isError && (
          <EmptyState
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
        <Button variant="secondary" onClick={signOut} className="self-start">
          Sair da conta
        </Button>
      </div>
    </Container>
  )
}
