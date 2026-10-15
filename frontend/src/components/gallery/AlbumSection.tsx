import type { MouseEvent } from 'react'
import { countLabel } from '../../lib/gallery'
import { galleryImageSrc } from '../../services/gallery'
import type { GalleryAlbum } from '../../types/gallery'

interface AlbumSectionProps {
  album: GalleryAlbum
  onOpen: (photoId: string) => void
}

const isPlainClick = (event: MouseEvent) => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey

export function AlbumSection({ album, onOpen }: AlbumSectionProps) {
  const headingId = `album-${album.photos[0]?.id}`

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2.5 border-t-[1.5px] border-brown pt-3.5 desktop:gap-4 desktop:pt-5">
      <div className="flex items-baseline justify-between gap-2.5 desktop:justify-start desktop:gap-4">
        <h2 id={headingId} className="m-0 text-[1.25rem] leading-[1.25] font-bold desktop:text-[1.625rem] desktop:leading-[1.2]">
          {album.name}
        </h2>
        <span className="flex-none text-[0.8125rem] font-semibold text-brown-400 desktop:text-small">{countLabel(album.photos.length)}</span>
      </div>
      <ul className="m-0 grid list-none grid-cols-2 gap-1.5 p-0 desktop:grid-cols-4 desktop:gap-3">
        {album.photos.map((photo) => (
          <li key={photo.id} className="min-w-0">
            <a
              href={galleryImageSrc(photo.url)}
              onClick={(event) => {
                if (!isPlainClick(event)) return
                event.preventDefault()
                onOpen(photo.id)
              }}
              className="flex flex-col gap-1 text-brown no-underline hover:text-brown desktop:gap-1.5"
            >
              <img
                src={galleryImageSrc(photo.url)}
                alt={photo.alt}
                loading="lazy"
                decoding="async"
                className="block aspect-square w-full bg-cream-dark object-cover"
              />
              {photo.caption && <span className="text-[0.8125rem] leading-[1.4] text-brown-600 desktop:text-small desktop:leading-[1.45]">{photo.caption}</span>}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
