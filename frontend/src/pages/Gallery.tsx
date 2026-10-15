import { useMemo, useState } from 'react'
import { AlbumSection } from '../components/gallery/AlbumSection'
import { PhotoViewer } from '../components/gallery/PhotoViewer'
import { Button, Container, EmptyState, LoadingState, PageHeader, Skeleton } from '../components/ui'
import { EMPTY_GALLERY, flattenAlbums } from '../lib/gallery'
import { useGallery } from '../services/gallery'

function GalleryLoading() {
  return (
    <LoadingState label="Carregando a galeria…" className="gap-6 desktop:gap-10">
      {[0, 1].map((album) => (
        <div key={album} aria-hidden="true" className="flex flex-col gap-3 border-t-[1.5px] border-line pt-3.5">
          <Skeleton className="h-6 w-2/5" />
          <div className="grid grid-cols-2 gap-1.5 desktop:grid-cols-4 desktop:gap-3">
            {[0, 1].map((photo) => (
              <Skeleton key={photo} className="aspect-square w-full" />
            ))}
          </div>
        </div>
      ))}
    </LoadingState>
  )
}

export function Gallery() {
  const { data: albums, isPending, isError, refetch } = useGallery()
  const photos = useMemo(() => flattenAlbums(albums ?? []), [albums])
  const [current, setCurrent] = useState<number | null>(null)

  return (
    <Container className="pb-8 desktop:pb-18">
      <PageHeader overline="Galeria" title="Galeria" lead="Registros das nossas ações, oficinas e apresentações." className="desktop:pb-10" />

      {isPending && <GalleryLoading />}

      {isError && (
        <EmptyState
          tone="error"
          title="Não conseguimos carregar a galeria agora"
          text="A conexão pode ter falhado. Tente de novo em instantes."
          actions={
            <Button variant="secondary" size="compact" onClick={() => void refetch()}>
              Tentar de novo
            </Button>
          }
        />
      )}

      {albums && albums.length === 0 && (
        <p role="status" className="m-0 max-w-3xl border border-line bg-card p-4 text-[0.96875rem] leading-[1.6] desktop:p-5 desktop:text-[1.0625rem]">
          {EMPTY_GALLERY}
        </p>
      )}

      {albums && albums.length > 0 && (
        <div className="enter-list flex flex-col gap-6 desktop:gap-10">
          {albums.map((album) => (
            <AlbumSection key={album.name} album={album} onOpen={(id) => setCurrent(photos.findIndex((photo) => photo.id === id))} />
          ))}
        </div>
      )}

      <PhotoViewer photos={photos} index={current} onIndexChange={setCurrent} onClose={() => setCurrent(null)} />
    </Container>
  )
}
