import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { VolunteerDetail } from '../../components/admin/VolunteerDetail'
import { VolunteerFilters } from '../../components/admin/VolunteerFilters'
import { VolunteerRow } from '../../components/admin/VolunteerRow'
import { Button, Chevron, EmptyState, useToast } from '../../components/ui'
import { cn } from '../../lib/cn'
import { DESKTOP_QUERY, useMediaQuery } from '../../lib/use-media-query'
import { STATUS_ORDER } from '../../lib/volunteering'
import { downloadVolunteersCsv, useAdminVolunteer, useAdminVolunteers } from '../../services/admin-volunteers'
import { useVolunteerAreas } from '../../services/volunteering'
import type { VolunteerFilters as Filters, VolunteerStatus } from '../../types/volunteering'

const LIST_PATH = '/admin/voluntarios'
const AREA_PATTERN = /^[a-z0-9-]{1,40}$/

function parseFilters(search: URLSearchParams): Filters {
  const status = search.get('status')
  const area = search.get('area')
  return {
    status: STATUS_ORDER.find((value) => value === status),
    area: area && AREA_PATTERN.test(area) ? area : undefined,
  }
}

function ErrorCard({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <EmptyState
      tone="error"
      title={title}
      text="Tente de novo em alguns minutos."
      actions={
        <Button variant="secondary" size="compact" onClick={onRetry}>
          Tentar de novo
        </Button>
      }
    />
  )
}

export function AdminVolunteers() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = parseFilters(searchParams)
  const desktop = useMediaQuery(DESKTOP_QUERY)
  const toast = useToast()
  const list = useAdminVolunteers(filters)
  const areas = useVolunteerAreas()
  const [downloading, setDownloading] = useState(false)

  const rows = list.data?.data ?? []
  const detailId = id ?? (desktop ? rows[0]?.id : undefined)
  const detail = useAdminVolunteer(detailId)
  const application = detail.data ?? rows.find((row) => row.id === detailId)
  const search = searchParams.toString()
  const suffix = search ? `?${search}` : ''
  const hasFilters = Boolean(filters.status || filters.area)

  function setFilter(key: 'status' | 'area', value: VolunteerStatus | string | undefined) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }

  async function download() {
    setDownloading(true)
    try {
      await downloadVolunteersCsv(filters)
    } catch {
      toast('Não foi possível baixar a planilha agora. Tente de novo.', { tone: 'error' })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="desktop:grid desktop:grid-cols-[minmax(0,1fr)_33.75rem]">
      <section aria-label="Fila de candidaturas" className={cn('flex min-w-0 flex-col gap-5 px-4 pt-5 pb-8 desktop:pr-8 desktop:pl-10 desktop:pt-9 desktop:pb-12', id && 'max-desktop:hidden')}>
        <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 desktop:pb-1.5">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="m-0 text-[1.75rem] leading-[1.2] font-bold text-pretty desktop:text-[2.125rem]">Voluntários</h1>
            <p className="m-0 max-w-[40rem] text-small leading-[1.2] text-brown-400">Quem se candidata pela página de voluntariado do site aparece aqui.</p>
          </div>
          <Button variant="secondary" size="compact" className="min-h-11 whitespace-nowrap desktop:translate-y-3.5" disabled={downloading} onClick={() => void download()}>
            {downloading ? 'Preparando…' : 'Exportar CSV'}
          </Button>
        </header>

        <VolunteerFilters
          status={filters.status}
          area={filters.area}
          counts={list.data?.counts}
          areas={areas.data ?? []}
          onStatus={(status) => setFilter('status', status)}
          onArea={(area) => setFilter('area', area)}
        />

        {list.isPending && (
          <p role="status" className="m-0">
            Carregando as candidaturas…
          </p>
        )}
        {list.isError && <ErrorCard title="Não conseguimos carregar as candidaturas" onRetry={() => void list.refetch()} />}
        {list.data && rows.length === 0 && (
          <EmptyState
            title={hasFilters ? 'Nenhuma candidatura com esses filtros' : 'Ninguém se candidatou ainda'}
            text={hasFilters ? 'Troque a situação ou a área para ver as outras.' : 'Quando alguém se candidatar pela página de voluntariado, aparece aqui.'}
          />
        )}
        {rows.length > 0 && (
          <ul aria-label="Candidaturas" className="m-0 list-none border-t border-line p-0 desktop:-mt-3.5 desktop:border-t-0">
            {rows.map((row) => (
              <VolunteerRow key={row.id} application={row} to={`${LIST_PATH}/${row.id}${suffix}`} selected={row.id === detailId} />
            ))}
          </ul>
        )}
      </section>

      <section
        aria-label="Candidatura escolhida"
        className={cn('min-w-0 desktop:sticky desktop:top-18 desktop:h-[calc(100dvh-4.5rem)] desktop:border-l desktop:border-line', !id && 'max-desktop:hidden')}
      >
        <div className="flex h-15 items-center justify-between border-b border-line px-1 desktop:hidden">
          <Link to={`${LIST_PATH}${suffix}`} className="flex min-h-11 items-center gap-2 px-3 text-[0.9375rem] font-semibold text-brown no-underline hover:text-blue-deep">
            <Chevron direction="left" />
            <span>
              <span className="sr-only">Voltar para</span> Voluntários
            </span>
          </Link>
          <span className="mr-3 border border-brown px-2 py-0.5 text-[0.6875rem] font-bold tracking-[0.1em] uppercase">Equipe</span>
        </div>
        {detail.isPending && detailId && !application && (
          <p role="status" className="m-0 p-4">
            Carregando a candidatura…
          </p>
        )}
        {detail.isError && !application && (
          <div className="p-4 desktop:p-8">
            <EmptyState title="Não encontramos essa candidatura" text="Ela pode ter sido apagada. Volte para a fila." actions={<Button to={`${LIST_PATH}${suffix}`} variant="secondary" size="compact">Voltar para a fila</Button>} />
          </div>
        )}
        {application && <VolunteerDetail key={application.id} application={application} />}
      </section>
    </div>
  )
}
