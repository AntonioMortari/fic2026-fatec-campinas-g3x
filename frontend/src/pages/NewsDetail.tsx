import { Link, useParams } from 'react-router-dom'
import { LoadingSession } from '../components/auth/LoadingSession'
import { BackBar } from '../components/layout/BackBar'
import { NewsKindTag } from '../components/news/NewsKindTag'
import { ShareButton } from '../components/news/ShareButton'
import { BackLink, Button, Container, EmptyState } from '../components/ui'
import { isMissingNews, longDate, NEWS_PATH } from '../lib/news'
import { newsImageSrc, useNews } from '../services/news'
import { NotFound } from './NotFound'

export function NewsDetail() {
  const { id } = useParams()
  const news = useNews(id)

  if (news.isPending) return <LoadingSession />

  if (news.isError) {
    if (isMissingNews(news.error)) return <NotFound />
    return (
      <Container className="pt-6 pb-10">
        <EmptyState
          tone="error"
          title="Não conseguimos carregar a notícia"
          text="A conexão pode ter falhado. Tente de novo em instantes."
          actions={
            <Button variant="secondary" size="compact" onClick={() => void news.refetch()}>
              Tentar de novo
            </Button>
          }
        />
      </Container>
    )
  }

  const item = news.data

  return (
    <>
      <BackBar to={NEWS_PATH} label="Notícias" onDesktop={false} />
      <Container className="pb-10 desktop:pb-18">
        <div className="mx-auto max-w-180">
          <div className="hidden desktop:block desktop:pt-4">
            <BackLink to={NEWS_PATH} label="Notícias" tone="link" />
          </div>
          <article className="flex flex-col gap-4 pt-6 desktop:pt-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <NewsKindTag kind={item.kind} />
              {item.publishedAt && (
                <time dateTime={item.publishedAt} className="text-[0.84375rem] font-semibold text-ochre-deep">
                  {longDate(item.publishedAt)}
                </time>
              )}
            </div>
            <h1 className="m-0 text-[1.875rem] leading-[1.12] font-bold text-balance">{item.title}</h1>
            {item.summary && <p className="m-0 text-[1.125rem] leading-normal text-brown-600">{item.summary}</p>}
            {item.image && (
              <img
                src={newsImageSrc(item.image.url)}
                alt={item.image.alt}
                className="-mx-4 block aspect-[16/10] w-[calc(100%+2rem)] max-w-none bg-cream-dark object-cover desktop:mx-0 desktop:w-full"
              />
            )}
            {item.paragraphs.map((paragraph, index) => (
              <p key={index} className="m-0 text-[1.03125rem] leading-[1.65] whitespace-pre-line">
                {paragraph}
              </p>
            ))}
            <div className="grid grid-cols-2 gap-2.5 border-t border-line pt-4">
              <ShareButton title={item.title} />
              <Link to={NEWS_PATH} className="flex min-h-12 items-center justify-center px-2 text-center text-[0.9375rem] font-semibold text-blue-deep no-underline hover:text-brown">
                Ver todas as notícias
              </Link>
            </div>
          </article>
        </div>
      </Container>
    </>
  )
}
