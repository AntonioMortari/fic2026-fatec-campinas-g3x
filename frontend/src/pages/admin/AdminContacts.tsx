import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ContactDetail } from '../../components/admin/ContactDetail'
import { ContactFilters } from '../../components/admin/ContactFilters'
import { ContactPager } from '../../components/admin/ContactPager'
import { ContactRow } from '../../components/admin/ContactRow'
import { Button, Chevron, EmptyState, useToast } from '../../components/ui'
import { cn } from '../../lib/cn'
import { CONTACTS_PATH, CONTACT_STATUS_ORDER, parsePage } from '../../lib/contacts-admin'
import { DESKTOP_QUERY, useMediaQuery } from '../../lib/use-media-query'
import { downloadContactsCsv, useAdminContact, useAdminContacts } from '../../services/admin-contacts'
import type { ContactFilters as Filters, ContactStatus } from '../../types/contacts'

function parseFilters(search: URLSearchParams): Filters {
  const status = search.get('status')
  return { status: CONTACT_STATUS_ORDER.find((value) => value === status), page: parsePage(search.get('pagina')) }
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

export function AdminContacts() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = parseFilters(searchParams)
  const desktop = useMediaQuery(DESKTOP_QUERY)
  const toast = useToast()
  const list = useAdminContacts(filters)
  const [downloading, setDownloading] = useState(false)

  const rows = list.data?.data ?? []
  const pagination = list.data?.pagination
  const detailId = id ?? (desktop ? rows[0]?.id : undefined)
  const detail = useAdminContact(detailId)
  const contact = detail.data ?? rows.find((row) => row.id === detailId)
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const hasFilter = Boolean(filters.status)

  useEffect(() => {
    if (pagination && !list.isPlaceholderData && pagination.page > pagination.totalPages) {
      const next = new URLSearchParams(searchParams)
      if (pagination.totalPages > 1) next.set('pagina', String(pagination.totalPages))
      else next.delete('pagina')
      setSearchParams(next, { replace: true })
    }
  }, [pagination, list.isPlaceholderData, searchParams, setSearchParams])

  function setStatus(status: ContactStatus | undefined) {
    const next = new URLSearchParams(searchParams)
    next.delete('pagina')
    if (status) next.set('status', status)
    else next.delete('status')
    setSearchParams(next, { replace: true })
  }

  function pageHref(page: number) {
    const next = new URLSearchParams(searchParams)
    if (page > 1) next.set('pagina', String(page))
    else next.delete('pagina')
    const query = next.toString()
    return `${CONTACTS_PATH}${query ? `?${query}` : ''}`
  }

  async function download() {
    setDownloading(true)
    try {
      await downloadContactsCsv(filters)
    } catch {
      toast('Não foi possível baixar a planilha agora. Tente de novo.', { tone: 'error' })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="desktop:grid desktop:grid-cols-[minmax(0,1fr)_33.75rem]">
      <section aria-label="Fila de mensagens" className={cn('flex min-w-0 flex-col gap-5 px-4 pt-5 pb-8 desktop:pr-8 desktop:pl-10 desktop:pt-9 desktop:pb-12', id && 'max-desktop:hidden')}>
        <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 desktop:pb-1.5">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="m-0 text-[1.75rem] leading-[1.2] font-bold text-pretty desktop:text-[2.125rem]">Mensagens</h1>
            <p className="m-0 max-w-[40rem] text-small desktop:max-w-[26rem] leading-[1.2] text-brown-400">Tudo que chega pelo formulário da página de contato do site aparece aqui.</p>
          </div>
          <Button variant="secondary" size="compact" className="min-h-11 whitespace-nowrap desktop:translate-y-3.5" disabled={downloading} onClick={() => void download()}>
            {downloading ? 'Preparando…' : 'Exportar CSV'}
          </Button>
        </header>

        <ContactFilters status={filters.status} counts={list.data?.counts} onStatus={setStatus} />

        {list.isPending && (
          <p role="status" className="m-0">
            Carregando as mensagens…
          </p>
        )}
        {list.isError && !list.data && <ErrorCard title="Não conseguimos carregar as mensagens" onRetry={() => void list.refetch()} />}
        {list.data && rows.length === 0 && (
          <EmptyState
            title={hasFilter ? 'Nenhuma mensagem com esse filtro' : 'Nenhuma mensagem ainda'}
            text={hasFilter ? 'Troque a situação para ver as outras.' : 'Quando alguém escrever pelo formulário da página de contato, aparece aqui.'}
          />
        )}
        {rows.length > 0 && (
          <ul aria-label="Mensagens" className="m-0 list-none border-t border-line p-0 desktop:-mt-3.5 desktop:border-t-0">
            {rows.map((row) => (
              <ContactRow key={row.id} contact={row} to={`${CONTACTS_PATH}/${row.id}${suffix}`} selected={row.id === detailId} />
            ))}
          </ul>
        )}
        {pagination && rows.length > 0 && <ContactPager pagination={pagination} hrefFor={pageHref} />}

        <details className="border border-line bg-card">
          <summary className="flex min-h-11 cursor-pointer items-center px-3.5 text-small font-semibold">Como funciona esta tela</summary>
          <ul className="m-0 flex list-disc flex-col gap-1.5 px-3.5 pt-1 pb-3.5 pl-8 text-small leading-[1.4]">
            <li>Cada linha é uma mensagem enviada pelo formulário da página de Contato do site.</li>
            <li>A fila começa por quem ainda espera resposta: novas, depois em contato, depois concluídas.</li>
            <li>Marcar a situação não apaga nada, e dá para voltar atrás.</li>
            <li>A nota interna só a equipe vê. Quem escreveu não a recebe.</li>
          </ul>
        </details>
      </section>

      <section
        aria-label="Mensagem escolhida"
        className={cn('min-w-0 desktop:sticky desktop:top-18 desktop:h-[calc(100dvh-4.5rem)] desktop:border-l desktop:border-line', !id && 'max-desktop:hidden')}
      >
        <div className="flex h-15 items-center justify-between border-b border-line px-1 desktop:hidden">
          <Link to={`${CONTACTS_PATH}${suffix}`} className="flex min-h-11 items-center gap-2 px-3 text-[0.9375rem] font-semibold text-brown no-underline hover:text-blue-deep">
            <Chevron direction="left" />
            <span>
              <span className="sr-only">Voltar para</span> Mensagens
            </span>
          </Link>
          <span className="mr-3 border border-brown px-2 py-0.5 text-[0.6875rem] font-bold tracking-[0.1em] uppercase">Painel</span>
        </div>
        {detail.isPending && detailId && !contact && (
          <p role="status" className="m-0 p-4">
            Carregando a mensagem…
          </p>
        )}
        {detail.isError && !contact && (
          <div className="p-4 desktop:p-8">
            <EmptyState
              title="Não encontramos essa mensagem"
              text="Volte para a fila e escolha outra."
              actions={
                <Button to={`${CONTACTS_PATH}${suffix}`} variant="secondary" size="compact">
                  Voltar para a fila
                </Button>
              }
            />
          </div>
        )}
        {contact && <ContactDetail key={contact.id} contact={contact} />}
      </section>
    </div>
  )
}
