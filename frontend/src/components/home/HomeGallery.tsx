import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import type { HomePhoto } from '../../lib/gallery'
import { galleryImageSrc } from '../../services/gallery'
import { Container } from '../ui'

const LINK_TEXT = (
  <>
    Ver todos os álbuns<span className="hidden desktop:inline"> →</span>
  </>
)

// The photos that went on air last (design 14a: five, the first one big; 14b: three). It disappears when there is none.
export function HomeGallery({ photos }: { photos: HomePhoto[] }) {
  if (photos.length === 0) return null
  const [first, ...others] = photos

  return (
    <Container as="section" aria-labelledby="home-gallery-title" className="flex flex-col gap-3 pt-11 desktop:gap-5 desktop:pt-22">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="home-gallery-title" className="m-0 text-[1.5rem] leading-[1.15] font-bold desktop:text-[1.75rem] desktop:leading-[normal]">
          Da galeria
        </h2>
        <Link to="/galeria" className="hidden text-[0.9375rem] font-semibold text-blue-deep underline desktop:inline">
          Ver todos os álbuns →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-1.5 desktop:grid-cols-[2fr_1fr_1fr] desktop:grid-rows-[13.75rem_13.75rem] desktop:gap-3">
        <figure className="relative col-span-2 m-0 desktop:col-span-1 desktop:row-span-2">
          <img src={galleryImageSrc(first!.url)} alt={first!.alt} loading="lazy" className="block aspect-[16/10] w-full object-cover desktop:aspect-auto desktop:h-full" />
          <figcaption className="absolute bottom-0 left-0 border-t-[1.5px] border-r-[1.5px] border-brown bg-card px-3 py-1.5 text-[0.8125rem] leading-[normal] font-bold desktop:px-3.5 desktop:py-2 desktop:text-[0.875rem]">
            {first!.album}
          </figcaption>
        </figure>
        {others.slice(0, 4).map((photo, index) => (
          <img
            key={photo.id}
            src={galleryImageSrc(photo.url)}
            alt={photo.alt}
            loading="lazy"
            className={cn('block aspect-square w-full object-cover desktop:aspect-auto desktop:h-full', index >= 2 && 'hidden desktop:block')}
          />
        ))}
      </div>
      <Link
        to="/galeria"
        className="flex min-h-12 items-center justify-center border-[1.5px] border-brown text-[0.9375rem] font-semibold text-brown no-underline hover:text-brown desktop:hidden"
      >
        {LINK_TEXT}
      </Link>
    </Container>
  )
}
