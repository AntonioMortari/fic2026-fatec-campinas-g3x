import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { AttendanceRow } from '../../components/admin/AttendanceRow'
import { BackLink, Button, EmptyState, useToast } from '../../components/ui'
import { isMissingEvent } from '../../lib/api-error'
import { dateParts } from '../../lib/dates'
import { displayNames, plain } from '../../lib/attendance'
import { useAttendance, useMarkAttendance } from '../../services/admin-events'
import type { AttendanceEntry } from '../../types/attendance'
import { NotFound } from '../NotFound'

const GROUP = 'm-0 mt-3 mb-1 text-overline font-semibold uppercase tracking-[0.12em]'

export function AdminAttendance() {
  const { id } = useParams()
  const toast = useToast()
  const { data, isPending, isError, error, refetch } = useAttendance(id)
  const mark = useMarkAttendance(id)
  const [search, setSearch] = useState('')

  if (isError && isMissingEvent(error)) return <NotFound />

  const entries = data?.data ?? []
  const names = displayNames(entries)
  const came = entries.filter((entry) => entry.attended === true).length
  const missed = entries.filter((entry) => entry.attended === false).length
  const checked = came + missed
  const shown = search.trim() ? entries.filter((entry) => plain(entry.name).includes(plain(search.trim()))) : entries
  const pending = shown.filter((entry) => entry.attended === null)
  const done = shown.filter((entry) => entry.attended !== null)

  function change(entry: AttendanceEntry, attended: boolean | null) {
    const previous = entry.attended
    mark.mutate(
      { registrationId: entry.id, attended },
      {
        onSuccess: () => {
          if (attended === null) return
          toast(`${names.get(entry.id) ?? entry.name} marcado como ${attended ? 'veio' : 'faltou'}`, {
            action: { label: 'Desfazer', onClick: () => change({ ...entry, attended }, previous) },
          })
        },
        onError: () => toast('Não foi possível marcar agora. A marca voltou como estava; tente de novo.', { tone: 'error' }),
      },
    )
  }

  return (
    <div className="max-w-xl pb-12 desktop:ml-12 desktop:pb-12">
      <div className="sticky top-0 z-20 border-b border-line bg-cream desktop:top-18">
        <div className="flex h-15 items-center justify-between px-4 desktop:h-auto desktop:px-0 desktop:pt-5">
          <BackLink to={`/admin/eventos/${id}/inscritos`} label="Inscritos" tone="link" />
          {entries.length > 0 && (
            <span className="text-[0.8125rem] text-brown-400">
              {checked} de {entries.length}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-3 px-4 pb-3.5 desktop:px-0">
          <div>
            <h1 className="m-0 text-[1.75rem] leading-[1.2] font-bold desktop:text-[2.125rem]">Lista de presença</h1>
            {data && <p className="m-0 text-small text-brown-400">{`${data.event.title} · ${dateParts(new Date(data.event.startsAt)).spoken}`}</p>}
          </div>
          {entries.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap justify-between gap-x-3 text-[0.8125rem] font-semibold">
                <span>
                  {checked} de {entries.length} conferidos
                </span>
                <span className="text-brown-400">
                  {came} {came === 1 ? 'veio' : 'vieram'} · {missed} {missed === 1 ? 'faltou' : 'faltaram'}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Conferidos"
                aria-valuemin={0}
                aria-valuemax={entries.length}
                aria-valuenow={checked}
                className="h-1.5 bg-cream-dark"
              >
                <div className="h-full bg-ochre" style={{ width: `${(checked / entries.length) * 100}%` }} />
              </div>
            </div>
          )}
          {entries.length > 0 && (
            <>
              <label htmlFor="attendance-search" className="sr-only">
                Buscar pelo nome
              </label>
              <input
                id="attendance-search"
                type="search"
                autoComplete="off"
                placeholder="Buscar pelo nome…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-h-11.5 w-full rounded-control border border-line-strong bg-card px-3.5 text-body text-brown outline-none placeholder:text-brown-300 focus:border-brown focus:shadow-focus"
              />
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pt-2">
        {isPending && <p role="status" className="m-0 pt-4">Carregando a lista…</p>}
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
        {entries.length > 0 && shown.length === 0 && <EmptyState title="Ninguém com esse nome" text="Confira a escrita ou limpe a busca." />}
        {pending.length > 0 && (
          <section aria-labelledby="pending-heading">
            <h2 id="pending-heading" className={`${GROUP} text-ochre-deep`}>
              Sem conferir · {pending.length}
            </h2>
            <ul className="m-0 flex list-none flex-col p-0">
              {pending.map((entry) => (
                <AttendanceRow key={entry.id} entry={entry} displayName={names.get(entry.id) ?? entry.name} onMark={(attended) => change(entry, attended)} />
              ))}
            </ul>
          </section>
        )}
        {done.length > 0 && (
          <section aria-labelledby="done-heading">
            <h2 id="done-heading" className={`${GROUP} text-brown-400`}>
              Conferidos · {done.length}
            </h2>
            <ul className="m-0 flex list-none flex-col p-0">
              {done.map((entry) => (
                <AttendanceRow key={entry.id} entry={entry} displayName={names.get(entry.id) ?? entry.name} onMark={(attended) => change(entry, attended)} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
