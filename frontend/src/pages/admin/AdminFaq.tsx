import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AdminPage } from '../../components/admin/AdminPage'
import { AdminTitle } from '../../components/admin/AdminTitle'
import { FaqAdminList } from '../../components/admin/FaqAdminList'
import { FaqItemForm, type FaqSubmit } from '../../components/admin/FaqItemForm'
import { FaqThemesPanel } from '../../components/admin/FaqThemesPanel'
import { Button, Chevron, EmptyState, useToast } from '../../components/ui'
import { cn } from '../../lib/cn'
import { ADMIN_FAQ_PATH } from '../../lib/faq'
import { DESKTOP_QUERY, useMediaQuery } from '../../lib/use-media-query'
import { useAdminFaq, useCreateFaqTheme, useMoveFaqItem, useSaveFaqItem, useSetFaqItemPublication } from '../../services/admin-faq'
import type { AdminFaq } from '../../types/faq'
import { NotFound } from '../NotFound'

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

function Editor({ data, id }: { data: AdminFaq; id: string | undefined }) {
  const navigate = useNavigate()
  const desktop = useMediaQuery(DESKTOP_QUERY)
  const toast = useToast()
  const item = id ? data.items.find((entry) => entry.id === id) : undefined
  const save = useSaveFaqItem(id)
  const createTheme = useCreateFaqTheme()
  const publication = useSetFaqItemPublication()

  if (id && !item) return <NotFound />

  async function submit({ input, newThemeName }: FaqSubmit, onError: (error: unknown) => void) {
    try {
      const themeId = newThemeName ? (await createTheme.mutateAsync(newThemeName)).id : input.themeId
      const saved = await save.mutateAsync({ ...input, themeId })
      toast(id ? (saved.published ? 'Alterações guardadas. A pergunta continua no ar.' : 'Alterações guardadas. A pergunta continua fora do ar.') : 'Pergunta guardada. Ela está fora do ar até você apertar “Pôr no ar”.')
      void navigate(desktop ? `${ADMIN_FAQ_PATH}/${saved.id}/editar` : ADMIN_FAQ_PATH, { replace: true })
    } catch (error) {
      onError(error)
    }
  }

  function toggle() {
    if (!item) return
    publication.mutate(
      { id: item.id, published: !item.published },
      {
        onSuccess: () => toast(item.published ? 'Tirada do ar. Ela continua guardada aqui e volta com um toque.' : 'No ar. A pergunta já aparece na página pública.'),
        onError: () => toast('Não foi possível mudar agora. Tente de novo.', { tone: 'error' }),
      },
    )
  }

  return (
    <FaqItemForm
      key={item?.id ?? 'new'}
      data={data}
      item={item}
      saving={save.isPending || createTheme.isPending}
      toggling={publication.isPending}
      onSubmit={(submitted, onError) => void submit(submitted, onError)}
      onTogglePublication={toggle}
    />
  )
}

export function AdminFaq() {
  const { id } = useParams()
  const { pathname } = useLocation()
  const writing = pathname === `${ADMIN_FAQ_PATH}/nova`
  const organizing = pathname === `${ADMIN_FAQ_PATH}/temas`
  const desktop = useMediaQuery(DESKTOP_QUERY)
  const toast = useToast()
  const list = useAdminFaq()
  const move = useMoveFaqItem()

  const data = list.data
  const editing = id ?? (writing || organizing || !desktop ? undefined : data?.items[0]?.id)
  const paneOpen = Boolean(id) || writing || organizing
  const showPane = paneOpen || (desktop && list.isSuccess)
  const onAir = data?.items.filter((item) => item.published).length ?? 0

  return (
    <div className="desktop:grid desktop:grid-cols-[minmax(0,1fr)_33.75rem]">
      <AdminPage className={cn('flex min-w-0 flex-col gap-4 desktop:border-r desktop:border-line desktop:pr-8 desktop:pl-10 desktop:pt-7 desktop:pb-6', paneOpen && 'max-desktop:hidden')}>
        <AdminTitle
          title="Perguntas frequentes"
          lead={data ? `${onAir} no ar · ${data.items.length - onAir} fora do ar · ordem por tema` : 'As respostas rápidas que aparecem na página pública.'}
          action={
            <span className="flex gap-2.5">
              <Button to={`${ADMIN_FAQ_PATH}/temas`} variant="secondary" size="compact" className="min-h-12 px-4 text-[0.9375rem] max-desktop:hidden">
                Temas
              </Button>
              <Button to={`${ADMIN_FAQ_PATH}/nova`} variant="applique" size="compact" className="min-h-12 px-5 whitespace-nowrap text-[0.9375rem]">
                Nova pergunta
              </Button>
            </span>
          }
        />

        {list.isPending && (
          <p role="status" className="m-0">
            Carregando as perguntas…
          </p>
        )}
        {list.isError && !data && <ErrorCard title="Não conseguimos carregar as perguntas" onRetry={() => void list.refetch()} />}
        {data && data.items.length === 0 && <EmptyState title="Nenhuma pergunta ainda" text="Escreva a primeira em “Nova pergunta”." />}
        {data && data.items.length > 0 && (
          <FaqAdminList
            data={data}
            selectedId={editing}
            moving={move.isPending}
            onMove={(itemId, direction) => move.mutate({ id: itemId, direction }, { onError: () => toast('Não foi possível mudar a ordem agora. Tente de novo.', { tone: 'error' }) })}
          />
        )}

        <p className="m-0 text-[0.84375rem] leading-normal text-brown-400">
          Não dá para apagar uma pergunta nem um tema, de propósito: “Tirar do ar” faz sumir do site na hora e guarda tudo, e volta com um toque.
        </p>
      </AdminPage>

      <section aria-label="Pergunta ou temas" className={cn('min-w-0 desktop:sticky desktop:top-18 desktop:flex desktop:h-[calc(100dvh-4.5rem)] desktop:flex-col', !paneOpen && 'max-desktop:hidden')}>
        <div className="flex h-15 items-center justify-between border-b border-line pr-2 pl-1 desktop:hidden">
          <Link to={ADMIN_FAQ_PATH} className="flex min-h-11 items-center gap-2 px-3 text-[0.9375rem] font-semibold text-brown no-underline hover:text-blue-deep">
            <Chevron direction="left" />
            <span>
              <span className="sr-only">Voltar para</span> Perguntas frequentes
            </span>
          </Link>
          <span className="mr-2 border-[1.5px] border-brown px-2 py-0.5 text-[0.6875rem] font-bold tracking-[0.1em] uppercase">Equipe</span>
        </div>
        {showPane && data && (organizing ? <FaqThemesPanel data={data} /> : <Editor key={editing ?? 'new'} data={data} id={editing} />)}
        {showPane && !data && list.isError && (
          <div className="p-4 desktop:p-8">
            <ErrorCard title="Não conseguimos carregar as perguntas" onRetry={() => void list.refetch()} />
          </div>
        )}
      </section>
    </div>
  )
}
