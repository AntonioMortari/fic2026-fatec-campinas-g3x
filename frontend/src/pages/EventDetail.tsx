import { useParams } from 'react-router-dom'
import { LoadingSession } from '../components/auth/LoadingSession'
import { EventActions } from '../components/event/EventActions'
import { EventBadge } from '../components/event/EventBadge'
import { EventFacts } from '../components/event/EventFacts'
import { EventPhoto } from '../components/event/EventPhoto'
import { RegistrationNotice } from '../components/event/RegistrationNotice'
import { BackBar } from '../components/layout/BackBar'
import { BackLink, Button, Container, EmptyState } from '../components/ui'
import { isMissingEvent } from '../lib/api-error'
import { descriptionParagraphs, describeRegistration } from '../lib/event-detail'
import { useEvent } from '../services/events'
import { NotFound } from './NotFound'

const PARAGRAPH = 'm-0 text-[1.03125rem] leading-[1.65] desktop:text-[1.125rem]'

export function EventDetail() {
  const { id } = useParams()
  const event = useEvent(id)

  if (event.isPending) return <LoadingSession />

  if (event.isError) {
    if (isMissingEvent(event.error)) return <NotFound />
    return (
      <Container className="pt-6 pb-10">
        <EmptyState
          tone="error"
          title="Não conseguimos carregar a atividade"
          text="A conexão pode ter falhado. Tente de novo em instantes."
          actions={
            <Button variant="secondary" size="compact" onClick={() => void event.refetch()}>
              Tentar de novo
            </Button>
          }
        />
      </Container>
    )
  }

  const detail = event.data
  const view = describeRegistration(detail)
  const [lead, ...rest] = descriptionParagraphs(detail.description)
  const leftItems = 1 + (lead ? 1 : 0) + (detail.image ? 1 : 0) + (rest.length > 0 ? 1 : 0)
  const withBar = view.action !== null

  return (
    <>
      <BackBar to="/agenda" label="Agenda" onDesktop={false} />
      <Container className="flex flex-col gap-4.5 pt-0 pb-8 desktop:grid desktop:grid-cols-[minmax(0,1fr)_25rem] desktop:items-start desktop:gap-x-14 desktop:gap-y-6 desktop:pt-4 desktop:pb-20">
        <div className="hidden desktop:col-span-2 desktop:col-start-1 desktop:row-start-1 desktop:-mb-5 desktop:block">
          <BackLink to="/agenda" label="Agenda" tone="link" />
        </div>

        {detail.image && (
          <EventPhoto
            image={detail.image}
            faded={view.faded}
            className="-mx-4 w-[calc(100%+2rem)] max-w-none desktop:order-3 desktop:col-start-1 desktop:mx-0 desktop:w-full"
          />
        )}

        <header className="flex flex-col gap-2.5 pt-1 desktop:order-1 desktop:col-start-1 desktop:gap-3 desktop:pt-0">
          {view.badge && <EventBadge label={view.badge.label} tone={view.badge.tone} />}
          <h1 className="m-0 text-[1.875rem] leading-[1.12] font-bold text-balance desktop:text-h1-desktop">{detail.title}</h1>
        </header>

        <aside
          aria-label="Quando, onde e inscrição"
          className="flex flex-col gap-4.5 desktop:sticky desktop:top-6 desktop:col-start-2 desktop:gap-4.5 desktop:border-[1.5px] desktop:border-brown desktop:bg-card desktop:p-6"
          style={{ gridRow: `2 / span ${leftItems}` }}
        >
          <EventFacts event={detail} />
          {view.notice && <RegistrationNotice notice={view.notice} className="desktop:bg-cream" />}
          {withBar && (
            <div className="hidden desktop:block">
              <EventActions event={detail} placement="card" />
            </div>
          )}
        </aside>

        {lead && <p className={`${PARAGRAPH} -mb-1.5 desktop:order-2 desktop:col-start-1 desktop:-mt-3 desktop:mb-0 desktop:max-w-[40rem] desktop:text-[1.3125rem] desktop:leading-normal desktop:text-brown-600`}>{lead}</p>}

        {rest.length > 0 && (
          <div className="flex flex-col gap-3 desktop:order-4 desktop:col-start-1 desktop:max-w-[42.5rem] desktop:gap-3.5 desktop:pt-2">
            {rest.map((paragraph, index) => (
              <p key={index} className={PARAGRAPH}>
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </Container>

      {withBar && (
        <div className="sticky bottom-[calc(3.5rem+1.5px+max(1rem,env(safe-area-inset-bottom)))] z-20 border-t border-line bg-cream desktop:hidden">
          <div className="mx-auto max-w-xl px-4 py-2.5">
            <EventActions event={detail} placement="bar" />
          </div>
        </div>
      )}
    </>
  )
}
