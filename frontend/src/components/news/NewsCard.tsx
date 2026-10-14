import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { longDate, NEWS_PATH } from '../../lib/news'
import { newsImageSrc } from '../../services/news'
import type { NewsItem } from '../../types/news'
import { NewsKindTag } from './NewsKindTag'

export function NewsCard({ item }: { item: NewsItem }) {
  const href = `${NEWS_PATH}/${item.id}`
  return (
    <article className="flex flex-col gap-2.5 border-b border-line pb-5 desktop:grid desktop:grid-cols-[20rem_minmax(0,1fr)] desktop:gap-x-7 desktop:gap-y-0 desktop:border-b-0 desktop:border-t desktop:pt-6 desktop:pb-0">
      {item.image ? (
        <img
          src={newsImageSrc(item.image.url)}
          alt={item.image.alt}
          loading="lazy"
          className="block aspect-video w-full bg-cream-dark object-cover desktop:aspect-[4/3]"
        />
      ) : (
        <span aria-hidden="true" className="hidden desktop:block" />
      )}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <NewsKindTag kind={item.kind} />
          {item.publishedAt && <span className="text-[0.84375rem] font-semibold text-ochre-deep desktop:text-small">{longDate(item.publishedAt)}</span>}
        </div>
        <h2 className="m-0 text-[1.3125rem] leading-tight font-bold desktop:text-[1.625rem] desktop:leading-[1.2]">
          <Link to={href} className="text-brown decoration-ochre underline-offset-4 desktop:underline-offset-5">
            {item.title}
          </Link>
        </h2>
        <p className="m-0 text-[0.96875rem] leading-[1.55] text-brown-600 desktop:max-w-[38.75rem] desktop:text-[1.03125rem] desktop:leading-[1.6]">{item.excerpt}</p>
        <Link
          to={href}
          className={cn(
            'flex min-h-11 items-center self-start border-[1.5px] border-brown px-4 text-[0.9375rem] font-semibold text-brown no-underline hover:bg-hover hover:text-brown desktop:mt-1 desktop:px-4.5',
          )}
        >
          Saber mais <span className="sr-only">sobre {item.title}</span>
        </Link>
      </div>
    </article>
  )
}
