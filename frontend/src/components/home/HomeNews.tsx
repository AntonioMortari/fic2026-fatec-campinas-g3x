import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { KIND_LABELS, longDate } from '../../lib/news'
import { newsImageSrc } from '../../services/news'
import type { NewsItem } from '../../types/news'
import { Container } from '../ui'

const LATEST = 3

// The latest three (designs 14a and 14b). On the desktop they are three columns of text; on the phone the first one is a card with
// its image and the others are lines. It disappears when nothing is published.
export function HomeNews({ news }: { news: NewsItem[] }) {
  const shown = news.slice(0, LATEST)
  if (shown.length === 0) return null

  return (
    <Container as="section" aria-labelledby="home-news-title" className="flex flex-col gap-3.5 pt-11 desktop:gap-5 desktop:pt-20">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="home-news-title" className="m-0 text-[1.5rem] leading-[1.15] font-bold desktop:text-[1.75rem] desktop:leading-[normal]">
          Notícias e campanhas
        </h2>
        <Link to="/noticias" className="hidden text-[0.9375rem] font-semibold text-blue-deep underline desktop:inline">
          Todas as notícias →
        </Link>
      </div>
      <ul className="m-0 flex list-none flex-col gap-3.5 p-0 desktop:grid desktop:grid-cols-3 desktop:gap-7">
        {shown.map((item, index) => {
          const lead = index === 0
          return (
            <li
              key={item.id}
              className={cn(
                'flex flex-col gap-1.5 desktop:gap-2.5 desktop:border-0 desktop:border-t-[1.5px] desktop:border-brown desktop:bg-transparent desktop:pt-4',
                lead ? 'border-[1.5px] border-brown bg-card' : '-mt-1.5 border-b border-brown/30 pb-3 desktop:mt-0 desktop:border-b-0 desktop:pb-0',
              )}
            >
              {lead && item.image && (
                <img src={newsImageSrc(item.image.url)} alt="" loading="lazy" className="block aspect-[16/9] w-full border-b-[1.5px] border-brown object-cover desktop:hidden" />
              )}
              <div className={cn('flex flex-col gap-1.5 desktop:gap-2.5', lead && 'px-4 pt-3.5 pb-4 desktop:p-0')}>
                <p className="m-0 flex items-center gap-2 text-[0.8125rem] leading-[normal] font-semibold text-ochre-deep desktop:gap-2.5 desktop:text-[0.84375rem]">
                  {item.kind === 'campaign' && (
                    <span className="border-[1.5px] border-brown bg-ochre px-1.75 py-px text-[0.65625rem] font-bold uppercase tracking-[0.06em] text-brown desktop:px-2 desktop:py-0.5 desktop:text-[0.6875rem]">
                      {KIND_LABELS.campaign}
                    </span>
                  )}
                  {item.publishedAt && <span>{longDate(item.publishedAt)}</span>}
                </p>
                <h3 className={cn('m-0 font-bold decoration-ochre underline-offset-4 desktop:text-[1.25rem] desktop:leading-[1.3] desktop:underline', lead ? 'text-[1.1875rem] leading-[1.25]' : 'text-[1.03125rem] leading-[1.3]')}>
                  <Link to={`/noticias/${item.id}`} className="text-brown no-underline hover:text-brown desktop:underline">
                    {item.title}
                  </Link>
                </h3>
                <p className={cn('m-0 text-[0.90625rem] leading-[1.5] text-brown-600 desktop:block desktop:text-[0.9375rem] desktop:leading-[1.55]', !lead && 'hidden')}>{item.excerpt}</p>
              </div>
            </li>
          )
        })}
      </ul>
      <Link to="/noticias" className="flex min-h-11 items-center text-[0.9375rem] font-semibold text-blue-deep underline desktop:hidden">
        Todas as notícias →
      </Link>
    </Container>
  )
}
