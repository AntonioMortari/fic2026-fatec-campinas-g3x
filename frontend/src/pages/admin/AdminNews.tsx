import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AdminNewsRow } from '../../components/admin/AdminNewsRow'
import { AdminPage } from '../../components/admin/AdminPage'
import { AdminTitle } from '../../components/admin/AdminTitle'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { NewsForm, type ImageChange } from '../../components/admin/NewsForm'
import { Button, Chevron, EmptyState, useToast } from '../../components/ui'
import { cn } from '../../lib/cn'
import { parseApiError } from '../../lib/api-error'
import { ADMIN_NEWS_PATH } from '../../lib/news'
import { toBase64 } from '../../lib/photo-file'
import { DESKTOP_QUERY, useMediaQuery } from '../../lib/use-media-query'
import {
  useAdminNews,
  useAdminNewsList,
  useRemoveNewsImage,
  useSaveNews,
  useSetNewsImage,
  useSetNewsPublication,
} from '../../services/admin-news'
import type { AdminNews as AdminNewsItem, NewsInput } from '../../types/admin-news'
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

function Editor({ id }: { id: string | undefined }) {
  const navigate = useNavigate()
  const desktop = useMediaQuery(DESKTOP_QUERY)
  const toast = useToast()
  const { state } = useLocation() as { state: { imageNotice?: string } | null }
  const existing = useAdminNews(id)
  const save = useSaveNews(id)
  const setImage = useSetNewsImage()
  const removeImage = useRemoveNewsImage()

  async function submit(input: NewsInput, image: ImageChange, onError: (error: unknown) => void) {
    let saved: AdminNewsItem
    try {
      saved = await save.mutateAsync(input)
    } catch (error) {
      onError(error)
      return
    }

    const edit = `${ADMIN_NEWS_PATH}/${saved.id}/editar`
    if (image) {
      try {
        if (image.kind === 'upload') await setImage.mutateAsync({ id: saved.id, data: await toBase64(image.blob), alt: image.alt })
        else await removeImage.mutateAsync(saved.id)
      } catch (error) {
        if (id) {
          onError(error)
        } else {
          void navigate(edit, { replace: true, state: { imageNotice: `O texto foi guardado como rascunho, mas a imagem não subiu. ${parseApiError(error).message}` } })
        }
        return
      }
    }

    toast(id ? (saved.published ? 'Alterações guardadas. A notícia continua no ar.' : 'Alterações guardadas. A notícia continua rascunho.') : 'Rascunho guardado. Publique quando estiver pronta.')
    void navigate(desktop ? edit : ADMIN_NEWS_PATH, { replace: true })
  }

  if (id && existing.isPending) {
    return (
      <p role="status" className="m-0 p-4 desktop:p-8">
        Carregando a notícia…
      </p>
    )
  }
  if (id && existing.isError) {
    if (parseApiError(existing.error).code === 'news_not_found') return <NotFound />
    return (
      <div className="p-4 desktop:p-8">
        <ErrorCard title="Não conseguimos carregar a notícia" onRetry={() => void existing.refetch()} />
      </div>
    )
  }

  return (
    <NewsForm
      key={existing.data?.id ?? 'new'}
      news={existing.data}
      saving={save.isPending || setImage.isPending || removeImage.isPending}
      notice={state?.imageNotice}
      onSubmit={(input, image, onError) => void submit(input, image, onError)}
    />
  )
}

export function AdminNews() {
  const { id } = useParams()
  const { pathname } = useLocation()
  const writing = pathname === `${ADMIN_NEWS_PATH}/nova`
  const desktop = useMediaQuery(DESKTOP_QUERY)
  const toast = useToast()
  const list = useAdminNewsList()
  const publication = useSetNewsPublication()
  const [asking, setAsking] = useState<AdminNewsItem | null>(null)

  const rows = list.data ?? []
  const editing = id ?? (writing || !desktop ? undefined : rows[0]?.id)
  const paneOpen = Boolean(id) || writing
  const showEditor = paneOpen || (desktop && list.isSuccess)

  function confirm() {
    if (!asking) return
    const target = asking
    publication.mutate(
      { id: target.id, published: !target.published },
      {
        onSuccess: () =>
          toast(
            target.published
              ? 'Tirada do ar. A notícia sumiu do site e continua guardada aqui, com o texto inteiro.'
              : 'Publicada. A notícia já aparece na página de notícias do site.',
          ),
        onError: () => toast('Não foi possível mudar agora. Tente de novo.', { tone: 'error' }),
        onSettled: () => setAsking(null),
      },
    )
  }

  return (
    <div className="desktop:grid desktop:grid-cols-[minmax(0,1fr)_37.5rem]">
      <AdminPage className={cn('flex min-w-0 flex-col gap-4 desktop:border-r desktop:border-line desktop:pr-8 desktop:pl-10 desktop:pt-7 desktop:pb-6', paneOpen && 'max-desktop:hidden')}>
        <AdminTitle
          title="Notícias"
          lead="Aqui você escreve o que aparece na página de notícias do site."
          action={
            <Button to={`${ADMIN_NEWS_PATH}/nova`} variant="applique" size="compact" className="min-h-12 px-5 whitespace-nowrap text-[0.9375rem]">
              Escrever notícia
            </Button>
          }
        />

        <details className="border border-line bg-card text-small leading-normal text-brown-600">
          <summary className="cursor-pointer px-3.5 py-3 text-small font-semibold text-brown">Como funciona esta tela</summary>
          <ul className="m-0 flex list-disc flex-col gap-1 px-3.5 pt-1 pb-3.5 pl-8">
            <li>
              <strong>Escrever não publica.</strong> A notícia fica guardada até você apertar “Publicar” — nada vai ao ar por acidente.
            </li>
            <li>
              <strong>“Tirar do ar” some com a notícia do site</strong>, e a data de publicação fica guardada.
            </li>
            <li>
              Quem visita o site <strong>só vê o que está publicado</strong>. Você vê tudo.
            </li>
          </ul>
        </details>

        {list.isPending && (
          <p role="status" className="m-0">
            Carregando as notícias…
          </p>
        )}
        {list.isError && !list.data && <ErrorCard title="Não conseguimos carregar as notícias" onRetry={() => void list.refetch()} />}
        {list.data && rows.length === 0 && <EmptyState title="Nenhuma notícia ainda" text="Escreva a primeira em “Escrever notícia”." />}
        {rows.length > 0 && (
          <ul aria-label="Notícias" className="m-0 flex list-none flex-col border-t border-line p-0 desktop:border-t-0">
            {rows.map((news) => (
              <AdminNewsRow
                key={news.id}
                news={news}
                selected={news.id === editing}
                busy={publication.isPending && publication.variables?.id === news.id}
                onPublication={() => setAsking(news)}
              />
            ))}
          </ul>
        )}

        <p className="m-0 text-[0.84375rem] leading-normal text-brown-400">
          Não dá para apagar uma notícia por aqui, de propósito: apagar não tem desfazer. “Tirar do ar” faz ela sumir do site na hora e guarda o texto inteiro.
        </p>
      </AdminPage>

      <section aria-label="Escrever ou editar notícia" className={cn('min-w-0 desktop:sticky desktop:top-18 desktop:flex desktop:h-[calc(100dvh-4.5rem)] desktop:flex-col', !paneOpen && 'max-desktop:hidden')}>
        <div className="flex h-15 items-center justify-between border-b border-line pr-2 pl-1 desktop:hidden">
          <Link to={ADMIN_NEWS_PATH} className="flex min-h-11 items-center gap-2 px-3 text-[0.9375rem] font-semibold text-brown no-underline hover:text-blue-deep">
            <Chevron direction="left" />
            <span>
              <span className="sr-only">Voltar para</span> Notícias
            </span>
          </Link>
          <span className="mr-2 border-[1.5px] border-brown px-2 py-0.5 text-[0.6875rem] font-bold tracking-[0.1em] uppercase">Equipe</span>
        </div>
        {showEditor && <Editor key={editing ?? 'new'} id={editing} />}
      </section>

      <ConfirmDialog
        open={Boolean(asking)}
        title={asking?.published ? 'Tirar do ar?' : 'Publicar?'}
        confirmLabel={asking?.published ? 'Tirar do ar' : 'Publicar'}
        busy={publication.isPending}
        onConfirm={confirm}
        onCancel={() => setAsking(null)}
      >
        {asking?.published
          ? `“${asking.title}” sai da página de notícias e deixa de ser vista por quem visita o site. A data de publicação fica guardada.`
          : `“${asking?.title ?? ''}” vai para a página de notícias e passa a ser vista por qualquer pessoa.`}
      </ConfirmDialog>
    </div>
  )
}
