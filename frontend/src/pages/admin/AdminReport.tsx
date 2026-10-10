import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PeriodPicker } from '../../components/report/PeriodPicker'
import { Swatch } from '../../components/report/Bar'
import { EventList, EventTable } from '../../components/report/EventRows'
import { Totals } from '../../components/report/Totals'
import { AdminPage } from '../../components/admin/AdminPage'
import { ActionBar, BackLink, Button, EmptyState, PageHeader, useToast } from '../../components/ui'
import { loadFailureText } from '../../lib/api-error'
import { listLabel } from '../../lib/report'
import { DESKTOP_QUERY, useMediaQuery } from '../../lib/use-media-query'
import { downloadReportCsv, useReport } from '../../services/report'
import type { ReportPeriod } from '../../types/report'

const PERIOD_PARAM: Record<string, ReportPeriod> = { mes: 'month', trimestre: 'quarter', semestre: 'semester' }
const PARAM_OF: Record<ReportPeriod, string> = { month: 'mes', quarter: 'trimestre', semester: 'semestre' }
const MAX_BACK = 240

function readBack(value: string | null): number {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 && number <= MAX_BACK ? number : 0
}

export function AdminReport() {
  const desktop = useMediaQuery(DESKTOP_QUERY)
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const period = PERIOD_PARAM[params.get('periodo') ?? ''] ?? 'month'
  const back = readBack(params.get('recuar'))
  const offset = back === 0 ? 0 : -back
  const report = useReport(period, offset)
  const [downloading, setDownloading] = useState(false)

  function go(nextPeriod: ReportPeriod, nextBack: number) {
    const next = new URLSearchParams()
    if (nextPeriod !== 'month') next.set('periodo', PARAM_OF[nextPeriod])
    if (nextBack > 0) next.set('recuar', String(nextBack))
    setParams(next, { replace: true })
  }

  async function download() {
    setDownloading(true)
    try {
      await downloadReportCsv(period, offset)
    } catch {
      toast('Não foi possível baixar a planilha agora. Tente de novo.', { tone: 'error' })
    } finally {
      setDownloading(false)
    }
  }

  const data = report.data
  const rows = data?.events ?? []
  const label = data ? listLabel(rows.length, data.eventsTotal) : null
  const csvButton = (
    <Button variant="secondary" disabled={downloading} onClick={() => void download()} className="min-h-12 grow basis-28 whitespace-nowrap print:hidden">
      {downloading ? 'Preparando…' : 'Baixar CSV'}
    </Button>
  )
  const pdfButton = (
    <Button variant="applique" onClick={() => window.print()} className="min-h-12 w-full grow basis-36 print:hidden desktop:w-auto">
      Salvar em PDF
    </Button>
  )

  return (
    <AdminPage className="pb-44 desktop:pb-12">
      {!desktop && (
        <div className="flex items-center pt-2 print:hidden">
          <BackLink to="/admin" label="Início" tone="link" />
        </div>
      )}
      <PageHeader
        className="pt-2 desktop:pt-0"
        titleClassName="text-[1.875rem] leading-[1.1] desktop:text-h1-desktop"
        leadClassName="text-[0.90625rem] text-brown-400"
        overline={desktop ? 'Prestação de contas' : undefined}
        title={desktop && data ? `Relatório · ${data.label}` : 'Relatório'}
        lead={desktop ? undefined : 'Para anexar a uma prestação de contas.'}
        aside={desktop ? <div className="flex gap-3">{csvButton}{pdfButton}</div> : undefined}
      />

      <div className="flex max-w-6xl flex-col gap-6 desktop:gap-7">
        <PeriodPicker
          period={period}
          onPeriod={(next) => go(next, 0)}
          label={data?.label ?? ''}
          canGoForward={back > 0}
          onBack={() => go(period, back + 1)}
          onForward={() => go(period, back - 1)}
          desktop={desktop}
        />

        {report.isPending && <p role="status" className="m-0">Carregando o relatório…</p>}
        {report.isError && !data && (
          <EmptyState
            tone="error"
            title="Não conseguimos carregar o relatório"
            text={loadFailureText(report.error)}
            actions={
              <Button variant="secondary" size="compact" onClick={() => void report.refetch()}>
                Tentar de novo
              </Button>
            }
          />
        )}

        {data && (
          <div className={`flex flex-col gap-6 desktop:gap-7 ${report.isPlaceholderData ? 'opacity-60' : ''}`} aria-busy={report.isPlaceholderData}>
            {!desktop && <p className="m-0 hidden text-h2 font-bold print:block">Período: {data.label}</p>}
            <Totals totals={data.totals} />

            {data.totals.unchecked !== null && data.totals.unchecked > 0 && (
              <p className="m-0 flex items-start gap-2.5 text-[0.9375rem] text-brown-600">
                <span className="mt-1.5"><Swatch kind="unchecked" /></span>
                <span>
                  <strong className="text-brown">{data.totals.unchecked}</strong> inscrições sem presença conferida. Não são faltas — é lista que ninguém marcou.
                </span>
              </p>
            )}

            <section aria-labelledby="by-activity" className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="by-activity" className="m-0 text-overline font-semibold tracking-[0.12em] text-brown-400 uppercase desktop:text-h2 desktop:tracking-normal desktop:text-brown desktop:normal-case">
                  Por atividade{!desktop && label ? ` · ${label}` : ''}
                </h2>
              </div>
              {rows.length === 0 && data.eventsTotal === 0 && (
                <EmptyState title="Nenhuma atividade realizada neste período" text="Quando uma atividade publicada acontecer, ela entra aqui." />
              )}
              {rows.length === 0 && data.eventsTotal === null && (
                <EmptyState tone="error" title="Não conseguimos listar as atividades deste período" text="Um traço no lugar de um número quer dizer que a contagem não respondeu." />
              )}
              {rows.length > 0 && (desktop ? <EventTable rows={rows} label={label} /> : <EventList rows={rows} />)}
            </section>

            <p className="m-0 max-w-3xl text-small text-brown-400">
              Crianças contam inscrições de menores feitas por um responsável, não pessoas únicas. “Sem conferir” não é falta. Um traço no lugar de um número quer dizer que a contagem não respondeu — não é zero.
            </p>
          </div>
        )}
      </div>

      {!desktop && <ActionBar wrap secondaryFirst primary={pdfButton} secondary={csvButton} />}
    </AdminPage>
  )
}
