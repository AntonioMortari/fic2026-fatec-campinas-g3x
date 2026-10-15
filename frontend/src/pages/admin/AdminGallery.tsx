import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AdminBackBar } from '../../components/admin/AdminBackBar'
import { AdminPage } from '../../components/admin/AdminPage'
import { AdminTitle } from '../../components/admin/AdminTitle'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { GalleryFilters } from '../../components/admin/GalleryFilters'
import { PanelNotice } from '../../components/admin/PanelNotice'
import { PhotoCard } from '../../components/admin/PhotoCard'
import { PhotoUploadForm } from '../../components/admin/PhotoUploadForm'
import { Button, EmptyState, LoadingState } from '../../components/ui'
import { cn } from '../../lib/cn'
import { parseApiError } from '../../lib/api-error'
import { ADMIN_GALLERY_NEW_PATH, ADMIN_GALLERY_PATH, FILTER_SLUGS, filterFromSlug, NOTICES, PUBLICATION_DIALOG, type NoticeKey } from '../../lib/gallery'
import { DESKTOP_QUERY, useMediaQuery } from '../../lib/use-media-query'
import { useAdminPhotos, useSetPhotoPublication } from '../../services/gallery'
import type { AdminPhoto, PhotoState } from '../../types/gallery'

interface Notice {
  text: string
  tone: 'done' | 'error'
}

const noticeOf = (key: NoticeKey): Notice => ({ text: NOTICES[key], tone: 'done' })

export function AdminGallery() {
  const desktop = useMediaQuery(DESKTOP_QUERY)
  const { pathname, state, key } = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const list = useAdminPhotos()
  const publication = useSetPhotoPublication()
  const [asking, setAsking] = useState<AdminPhoto | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [clearedAt, setClearedAt] = useState<string | null>(null)

  const creating = pathname === ADMIN_GALLERY_NEW_PATH
  const showList = desktop || !creating
  const showForm = desktop || creating
  const filter = filterFromSlug(searchParams.get('situacao'))
  const photos = list.data ?? []
  const visible = filter ? photos.filter((photo) => photo.state === filter) : photos
  const arrived = (state as { notice?: NoticeKey } | null)?.notice
  const shown = notice ?? (arrived && arrived in NOTICES && clearedAt !== key ? noticeOf(arrived) : null)

  function setFilter(next: PhotoState | undefined) {
    const params = new URLSearchParams(searchParams)
    if (next) params.set('situacao', FILTER_SLUGS[next])
    else params.delete('situacao')
    setSearchParams(params, { replace: true })
  }

  function clearNotice() {
    setNotice(null)
    setClearedAt(key)
  }

  function uploaded(done: NoticeKey) {
    if (desktop) setNotice(noticeOf(done))
    else void navigate(ADMIN_GALLERY_PATH, { state: { notice: done } })
  }

  function confirm() {
    if (!asking) return
    const target = asking
    clearNotice()
    publication.mutate(
      { id: target.id, published: !target.published },
      {
        onSuccess: () => setNotice(noticeOf(target.published ? 'taken_down' : 'published')),
        onError: (error) => setNotice({ text: parseApiError(error).message, tone: 'error' }),
        onSettled: () => setAsking(null),
      },
    )
  }

  const dialog = asking?.published ? PUBLICATION_DIALOG.take_down : PUBLICATION_DIALOG.publish

  return (
    <div className="desktop:grid desktop:grid-cols-[minmax(0,1fr)_27.5rem]">
      {showList && (
        <div className="min-w-0 desktop:border-r desktop:border-line">
          <AdminBackBar to="/admin" label="Painel" />
          <AdminPage className="flex flex-col gap-3.5 pt-5 desktop:gap-4 desktop:pr-8 desktop:pl-10 desktop:pt-7 desktop:pb-6">
            <AdminTitle title="Galeria" lead="Aqui ficam as fotos que aparecem na galeria do site." />

            {shown && <PanelNotice tone={shown.tone}>{shown.text}</PanelNotice>}

            <Button to={ADMIN_GALLERY_NEW_PATH} variant="applique" className="min-h-13 text-[1rem] desktop:hidden">
              Subir uma foto
            </Button>

            <GalleryFilters photos={list.data} state={filter} onState={setFilter} />

            {list.isPending && <LoadingState label="Carregando as fotos…" shape="rows" count={4} />}
            {list.isError && !list.data && (
              <EmptyState
                tone="error"
                title="Não conseguimos carregar as fotos"
                text="Tente de novo em alguns minutos."
                actions={
                  <Button variant="secondary" size="compact" onClick={() => void list.refetch()}>
                    Tentar de novo
                  </Button>
                }
              />
            )}
            {list.data && photos.length === 0 && <EmptyState title="Nenhuma foto enviada ainda" text="Envie a primeira em “Subir uma foto”." />}
            {list.data && photos.length > 0 && visible.length === 0 && <p className="m-0 text-[0.9375rem] text-brown-400">Nenhuma foto nesta situação.</p>}

            {visible.length > 0 && (
              <section aria-labelledby="sent-photos" className="flex flex-col gap-1">
                <h2 id="sent-photos" className="m-0 mt-1 text-[1.1875rem] font-bold desktop:sr-only">
                  Fotos já enviadas
                </h2>
                <ul className="enter-list m-0 flex list-none flex-col p-0 desktop:grid desktop:grid-cols-3 desktop:gap-4">
                  {visible.map((photo) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      desktop={desktop}
                      busy={publication.isPending && publication.variables?.id === photo.id}
                      onPublication={() => setAsking(photo)}
                    />
                  ))}
                </ul>
              </section>
            )}

            <details className="border border-line bg-card text-[0.875rem] leading-normal text-brown-600 max-desktop:order-last">
              <summary className="flex min-h-11 cursor-pointer items-center px-3.5 text-small font-semibold text-brown">Como funciona esta tela</summary>
              <ul className="m-0 flex list-disc flex-col gap-1 px-3.5 pt-1 pb-3.5 pl-8">
                <li>
                  <strong>Nenhuma foto vai ao ar sem autorização de uso de imagem registrada</strong> de quem aparece nela — e, no caso de crianças e adolescentes, de quem é responsável por elas.
                </li>
                <li>
                  <strong>Subir não publica.</strong> A foto fica guardada até você apertar “Publicar”.
                </li>
                <li>
                  <strong>“Tirar do ar” leva alguns minutos</strong> para o arquivo deixar de abrir para quem já o carregou. Se a autorização foi retirada, use <strong>“Apagar”</strong>, que age na hora.
                </li>
                <li>
                  Só <strong>imagem</strong>, até <strong>4 MB</strong>. Vídeo não cabe.
                </li>
              </ul>
            </details>

            <p className="m-0 text-[0.84375rem] leading-normal text-brown-400 max-desktop:order-last">
              Não dá para trocar a foto nem o texto de uma que já subiu: escolher a foto de novo é o mesmo trabalho que subir outra. Para corrigir, suba de novo e apague esta.
            </p>
          </AdminPage>
        </div>
      )}

      {showForm && (
        <aside aria-label="Subir uma foto" className={cn('min-w-0 desktop:sticky desktop:top-18 desktop:h-[calc(100dvh-4.5rem)] desktop:overflow-y-auto')}>
          <AdminBackBar to={ADMIN_GALLERY_PATH} label="Galeria" />
          <AdminPage className="flex flex-col gap-4 pt-5 desktop:px-8 desktop:pt-7 desktop:pb-8">
            {desktop ? (
              <h2 className="m-0 text-[1.5rem] leading-[1.2] font-bold">Subir uma foto</h2>
            ) : (
              <>
                <h1 className="m-0 text-[1.75rem] leading-[1.15] font-bold">Subir uma foto</h1>
                <p className="m-0 border border-line bg-card px-3.5 py-3 text-[0.90625rem] leading-normal">
                  <strong>Nenhuma foto vai ao ar sem autorização de uso de imagem registrada</strong> de quem aparece nela. Subir não publica.
                </p>
              </>
            )}
            <PhotoUploadForm onStart={clearNotice} onUploaded={uploaded} />
          </AdminPage>
        </aside>
      )}

      <ConfirmDialog open={Boolean(asking)} title={dialog.title} confirmLabel={dialog.confirm} busy={publication.isPending} onConfirm={confirm} onCancel={() => setAsking(null)}>
        {dialog.text}
      </ConfirmDialog>
    </div>
  )
}
