import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminPage } from '../../components/admin/AdminPage'
import { Button, Chevron, DateBadge, EmptyState } from '../../components/ui'
import { useAuth } from '../../contexts/useAuth'
import { greeting, shortDate, todayLabel } from '../../lib/dates'
import { eventMeta } from '../../lib/events'
import { useAdminEvents } from '../../services/admin-events'
import type { AdminEvent } from '../../types/admin-event'

const OVERLINE = 'm-0 text-overline font-semibold uppercase tracking-[0.12em] text-ochre-deep desktop:text-xs'

function endsAtOf(event: AdminEvent) {
  return new Date(event.endsAt ?? event.startsAt).getTime()
}

function capacityText(event: AdminEvent): string | null {
  if (event.capacity === null || event.spotsLeft === null) return null
  return `${event.spotsLeft} de ${event.capacity} vagas`
}

function NextEvent({ event }: { event: AdminEvent }) {
  const capacity = capacityText(event)
  const meta = eventMeta(event, { withCapacity: false })
  return (
    <section aria-labelledby="next-event" className="flex flex-col gap-3.5 border border-brown bg-card p-4 shadow-applique-hero desktop:gap-4 desktop:p-5.5 desktop:shadow-applique-hero-desktop">
      <h2 id="next-event" className={OVERLINE}>
        Próximo evento
      </h2>
      <div className="flex min-w-0 items-center gap-3.5">
        <DateBadge date={new Date(event.startsAt)} highlight size="panel" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="m-0 text-body leading-[1.2] font-bold desktop:text-[1.125rem]">{event.title}</h3>
          <p className="m-0 text-[0.84375rem] text-brown-400 desktop:text-small">{[meta, capacity].filter(Boolean).join(' · ')}</p>
        </div>
      </div>
      <Button to={`/admin/eventos/${event.id}/presenca`} fullWidth className="min-h-12 text-[0.9375rem]">
        Abrir lista de presença
      </Button>
    </section>
  )
}

function Later({ events }: { events: AdminEvent[] }) {
  if (events.length === 0) return null
  return (
    <section aria-labelledby="later-events" className="flex flex-col gap-1.5">
      <h2 id="later-events" className="m-0 text-xs font-semibold tracking-[0.12em] text-brown-400 uppercase">
        Depois
      </h2>
      <ul className="m-0 list-none border-t border-line p-0">
        {events.map((event) => (
          <li key={event.id} className="border-b border-line">
            <Link to={`/admin/eventos/${event.id}/inscritos`} className="grid min-h-12 grid-cols-[5.5rem_1fr] items-center gap-2.5 text-brown no-underline hover:text-blue-deep">
              <span className="text-[0.8125rem] font-bold text-ochre-deep uppercase">{shortDate(event.startsAt)}</span>
              <span className="text-[0.9375rem] font-semibold">{event.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Needs({ drafts }: { drafts: AdminEvent[] }) {
  return (
    <section aria-labelledby="needs" className="flex flex-col gap-3 desktop:gap-4">
      <h2 id="needs" className="m-0 text-[1.125rem] leading-[1.2] font-bold desktop:text-xl">
        Precisa de você{drafts.length > 0 && ` · ${drafts.length}`}
      </h2>
      {drafts.length > 0 ? (
        <ul className="m-0 list-none border-t border-brown p-0">
          <li className="border-b border-line">
            <Link
              to="/admin/eventos"
              className="group grid min-h-16 grid-cols-[2.75rem_1fr_auto] items-center gap-x-3 py-2 text-brown no-underline hover:text-brown desktop:min-h-17 desktop:grid-cols-[4.5rem_1fr_auto]"
            >
              <span className="text-2xl leading-none font-bold desktop:text-[1.75rem]">{drafts.length}</span>
              <span className="flex flex-col">
                <span className="text-[0.96875rem] leading-[1.2] font-bold transition-colors group-hover:text-blue-deep desktop:text-body">
                  {drafts.length === 1 ? 'Rascunho para publicar' : 'Rascunhos para publicar'}
                </span>
                <span className="text-[0.8125rem] text-brown-400 desktop:text-small">Só aparecem na agenda depois de publicados</span>
              </span>
              <span className="desktop:hidden">
                <Chevron />
              </span>
              <span className="hidden min-h-11 items-center border border-brown px-4 text-small font-semibold transition-colors group-hover:bg-hover desktop:inline-flex">Publicar</span>
            </Link>
          </li>
        </ul>
      ) : (
        <p className="m-0 border-t border-line pt-3 text-small text-brown-400">Nada esperando você. Tudo em dia.</p>
      )}
    </section>
  )
}

export function AdminHome() {
  const { user } = useAuth()
  const { data: events, isPending, isError, refetch } = useAdminEvents()
  const [now] = useState(() => new Date())
  const today = todayLabel(now)
  const upcoming = (events ?? []).filter((event) => event.published && endsAtOf(event) >= now.getTime()).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
  const drafts = (events ?? []).filter((event) => !event.published)
  const [next, ...later] = upcoming

  return (
    <AdminPage className="flex flex-col gap-5 desktop:gap-6.5">
      <header className="flex flex-col gap-0.5">
        <p className={OVERLINE}>
          <span className="desktop:hidden">{today.short}</span>
          <span className="hidden desktop:inline">{today.long}</span>
        </p>
        <h1 className="m-0 text-[1.75rem] leading-[1.2] font-bold desktop:text-[2.5rem]">
          {greeting(now)}
          {user && `, ${user.name}`}
        </h1>
      </header>

      {isPending && <p role="status" className="m-0">Carregando o painel…</p>}
      {isError && (
        <EmptyState
          tone="error"
          title="Não conseguimos carregar o painel"
          text="Tente de novo em alguns minutos."
          actions={
            <Button variant="secondary" size="compact" onClick={() => void refetch()}>
              Tentar de novo
            </Button>
          }
        />
      )}

      {events && (
        <div className="flex flex-col gap-6 desktop:grid desktop:grid-cols-[minmax(0,1fr)_26.5rem] desktop:gap-x-10 desktop:gap-y-4">
          <div className="flex flex-col gap-4 desktop:col-start-2 desktop:row-start-1">
            {next ? <NextEvent event={next} /> : <p className="m-0 border border-line bg-card p-4 text-small text-brown-400">Nenhum evento publicado vem por aí.</p>}
            <div className="max-desktop:hidden">
              <Later events={later.slice(0, 2)} />
            </div>
          </div>
          <div className="desktop:col-start-1 desktop:row-start-1">
            <Needs drafts={drafts} />
          </div>
          <div className="desktop:col-start-2 desktop:row-start-2">
            <Button to="/admin/eventos/novo" variant="secondary" fullWidth className="min-h-12 text-[0.90625rem] desktop:hidden">
              + Novo evento
            </Button>
            <Link to="/admin/eventos/novo" className="hidden min-h-11 items-center text-[0.9375rem] font-semibold text-blue-deep no-underline hover:text-brown desktop:inline-flex">
              + Novo evento
            </Link>
          </div>
        </div>
      )}
    </AdminPage>
  )
}
