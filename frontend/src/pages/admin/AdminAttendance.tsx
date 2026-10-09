import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { AttendanceRow } from '../../components/admin/AttendanceRow'
import { BackLink, Button, Container, EmptyState, PageHeader, TextField, useToast } from '../../components/ui'
import { dateParts } from '../../lib/dates'
import { useAttendance, useMarkAttendance } from '../../services/admin-events'
import { NotFound } from '../NotFound'

const plain = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR')

export function AdminAttendance() {
  const { id } = useParams()
  const toast = useToast()
  const { data, isPending, isError, error, refetch } = useAttendance(id)
  const mark = useMarkAttendance(id)
  const [search, setSearch] = useState('')

  if (isError && (error as { response?: { status?: number } }).response?.status === 404) return <NotFound />

  const entries = data?.data ?? []
  const came = entries.filter((entry) => entry.attended === true).length
  const didNot = entries.filter((entry) => entry.attended === false).length
  const unchecked = entries.length - came - didNot
  const shown = search.trim() ? entries.filter((entry) => plain(entry.name).includes(plain(search.trim()))) : entries

  function change(registrationId: string, attended: boolean | null) {
    mark.mutate({ registrationId, attended }, { onError: () => toast('Não foi possível marcar agora. A marca voltou como estava; tente de novo.', { tone: 'error' }) })
  }

  return (
    <Container className="pb-12">
      <div className="pt-2">
        <BackLink to="/admin/eventos" label="Eventos" />
      </div>
      <PageHeader
        overline="Equipe"
        title="Lista de presença"
        lead={data ? `${data.event.title} · ${dateParts(new Date(data.event.startsAt)).spoken}` : undefined}
      />

      <div className="flex max-w-xl flex-col gap-4">
        {isPending && <p role="status" className="m-0">Carregando a lista…</p>}
        {isError && (
          <EmptyState
            tone="error"
            title="Não conseguimos carregar a lista"
            text="Tente de novo em alguns minutos."
            actions={
              <Button variant="secondary" size="compact" onClick={() => void refetch()}>
                Tentar de novo
              </Button>
            }
          />
        )}
        {data && entries.length === 0 && <EmptyState title="Ninguém se inscreveu ainda" text="Quando alguém se inscrever pela agenda, aparece aqui." />}
        {entries.length > 0 && (
          <>
            <p className="m-0 text-[0.9375rem] font-semibold">
              {came} {came === 1 ? 'veio' : 'vieram'} · {didNot} não {didNot === 1 ? 'veio' : 'vieram'} · {unchecked} sem conferir
            </p>
            <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-small text-brown-600">
              <li>Toque em “Veio” ou “Não veio”. Toque de novo no botão marcado para desmarcar.</li>
              <li>“Sem conferir” não é falta: é quem ninguém marcou ainda.</li>
            </ul>
            <TextField label="Procurar pelo nome" type="search" value={search} onChange={(event) => setSearch(event.target.value)} autoComplete="off" />
            {shown.length === 0 && <EmptyState title="Ninguém com esse nome" text="Confira a escrita ou limpe a busca." />}
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {shown.map((entry) => (
                <AttendanceRow key={entry.id} entry={entry} onMark={(attended) => change(entry.id, attended)} />
              ))}
            </ul>
          </>
        )}
      </div>
    </Container>
  )
}
