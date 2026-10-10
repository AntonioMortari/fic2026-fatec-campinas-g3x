import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { isMissingEvent, loadFailureText } from '../../lib/api-error'
import { RegistrantCard } from '../../components/admin/RegistrantCard'
import { AdminPage } from '../../components/admin/AdminPage'
import { AdminTitle } from '../../components/admin/AdminTitle'
import { BackLink, Button, EmptyState, useToast } from '../../components/ui'
import { dateParts } from '../../lib/dates'
import { downloadRegistrationsCsv, useAdminRegistrations } from '../../services/admin-events'
import { NotFound } from '../NotFound'

export function AdminRegistrants() {
  const { id } = useParams()
  const toast = useToast()
  const { data, isPending, isError, error, refetch } = useAdminRegistrations(id)
  const [downloading, setDownloading] = useState(false)

  async function download() {
    if (!id) return
    setDownloading(true)
    try {
      await downloadRegistrationsCsv(id)
    } catch {
      toast('Não foi possível baixar a planilha agora. Tente de novo.', { tone: 'error' })
    } finally {
      setDownloading(false)
    }
  }

  if (isError && isMissingEvent(error)) return <NotFound />

  const registrations = data?.data ?? []
  const authorized = registrations.filter((registration) => registration.imageAuthorized).length
  const minors = registrations.filter((registration) => registration.isMinor).length

  return (
    <AdminPage className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <BackLink to="/admin/eventos" label="Eventos e presença" tone="link" />
        <AdminTitle title="Inscritos" lead={data ? `${data.event.title} · ${dateParts(new Date(data.event.startsAt)).spoken}` : undefined} />
      </div>

      <div className="flex max-w-xl flex-col gap-5">
        {isPending && <p role="status" className="m-0">Carregando os inscritos…</p>}
        {isError && (
          <EmptyState
            tone="error"
            title="Não conseguimos carregar os inscritos"
            text={loadFailureText(error)}
            actions={
              <Button variant="secondary" size="compact" onClick={() => void refetch()}>
                Tentar de novo
              </Button>
            }
          />
        )}
        {data && registrations.length === 0 && (
          <EmptyState title="Ninguém se inscreveu ainda" text="Quando alguém se inscrever pela agenda, aparece aqui." />
        )}
        {registrations.length > 0 && (
          <>
            <p className="m-0 text-[0.9375rem] text-brown-600">
              {registrations.length === 1 ? '1 pessoa inscrita' : `${registrations.length} pessoas inscritas`}
              {' · '}
              {authorized === 1 ? '1 autorizou' : `${authorized} autorizaram`} o uso da imagem
              {minors > 0 && ` · ${minors === 1 ? '1 menor de idade' : `${minors} menores de idade`}`}
            </p>
            <Button variant="secondary" size="compact" className="min-h-12 self-start" disabled={downloading} onClick={() => void download()}>
              {downloading ? 'Preparando…' : 'Baixar planilha'}
            </Button>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {registrations.map((registration) => (
                <RegistrantCard key={registration.id} registration={registration} />
              ))}
            </ul>
            <p className="m-0 text-small text-brown-400">
              Esta lista só se lê: o que a pessoa preencheu é registro e não se corrige nem se apaga por aqui. A planilha traz os mesmos dados, e são dados pessoais — não envie por aplicativos de conversa abertos nem deixe no celular.
            </p>
          </>
        )}
      </div>
    </AdminPage>
  )
}
