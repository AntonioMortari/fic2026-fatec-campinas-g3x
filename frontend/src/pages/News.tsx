import { NewsCard } from '../components/news/NewsCard'
import { NewsFollowCard } from '../components/news/NewsFollowCard'
import { Button, Container, EmptyState, PageHeader } from '../components/ui'
import { CONTACTS } from '../lib/contacts'
import { useNewsList } from '../services/news'

export function News() {
  const { data: items, isPending, isError, refetch } = useNewsList()

  return (
    <Container className="pb-10 desktop:grid desktop:grid-cols-[minmax(0,1fr)_18.75rem] desktop:gap-x-18 desktop:pb-18">
      <PageHeader overline="Notícias" title="Notícias" lead="O que anda acontecendo no ateliê." className="desktop:col-start-1 desktop:flex-col desktop:items-start desktop:gap-3" />

      <div className="flex flex-col gap-5 desktop:col-start-1 desktop:gap-6">
        {isPending && (
          <p role="status" className="m-0 text-brown-400">
            Carregando as notícias…
          </p>
        )}

        {isError && (
          <EmptyState
            tone="error"
            title="Não conseguimos carregar as notícias agora"
            text="A conexão pode ter falhado. Tente de novo em instantes."
            actions={
              <Button variant="secondary" size="compact" onClick={() => void refetch()}>
                Tentar de novo
              </Button>
            }
          />
        )}

        {items && items.length === 0 && (
          <p role="status" className="m-0 border border-line bg-card p-4 text-[0.96875rem] leading-[1.6] desktop:p-5 desktop:text-[1.0625rem]">
            Ainda não publicamos nenhuma notícia por aqui. Siga a gente no <a href={CONTACTS.instagram}>Instagram</a> ou fale pelo{' '}
            <a href={CONTACTS.whatsapp}>WhatsApp</a> para saber das novidades enquanto esta página ganha as primeiras publicações.
          </p>
        )}

        {items && items.length > 0 && (
          <ul aria-label="Notícias" className="m-0 flex list-none flex-col gap-5 p-0 desktop:gap-6">
            {items.map((item) => (
              <li key={item.id}>
                <NewsCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <NewsFollowCard />
    </Container>
  )
}
