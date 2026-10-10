import { useId, useMemo, useState } from 'react'
import { EventList } from '../components/agenda/EventList'
import { SchoolsPromo } from '../components/agenda/SchoolsPromo'
import { Button, ChipFilter, Container, EmptyState, PageHeader, TabList, panelId, tabId } from '../components/ui'
import { CONTACTS } from '../lib/contacts'
import { ALL_CATEGORIES, categoryOptions, filterByCategory, isFilterUseful } from '../lib/events'
import { useEvents } from '../services/events'
import type { EventPeriod } from '../types/event'

const TABS = [
  { id: 'upcoming', label: 'Em breve' },
  { id: 'past', label: 'Já aconteceu' },
]

export function Agenda() {
  const prefix = useId()
  const [period, setPeriod] = useState<EventPeriod>('upcoming')
  const [category, setCategory] = useState(ALL_CATEGORIES)
  const { data: events, isPending, isError, refetch } = useEvents(period)

  const options = useMemo(() => categoryOptions(events ?? []), [events])
  const showFilter = isFilterUseful(options, events?.length ?? 0)
  // On the desktop the column of types is part of the page whenever there is a type to filter by; the chips on the phone stay out of the way until they would tell something.
  const hasTypes = options.length > 1
  const visible = filterByCategory(events ?? [], category)

  function changePeriod(next: string) {
    setPeriod(next as EventPeriod)
    setCategory(ALL_CATEGORIES)
  }

  return (
    <Container className="pb-4 desktop:grid desktop:pb-18 desktop:grid-cols-[15rem_minmax(0,1fr)] desktop:gap-x-14">
      <PageHeader
        className="desktop:col-start-1 desktop:col-end-3 desktop:row-start-1"
        overline="Participar"
        title="Agenda"
        lead="Oficinas, apresentações e vivências abertas ao público. Para se inscrever não é preciso criar conta."
      />

      <div className="sticky top-15 z-20 -mx-4 bg-cream px-4 pb-3 desktop:static desktop:col-start-2 desktop:row-start-1 desktop:mx-0 desktop:w-85 desktop:justify-self-end desktop:self-end desktop:bg-transparent desktop:px-0 desktop:pb-8">
        <TabList tabs={TABS} activeId={period} onChange={changePeriod} label="Período" prefix={prefix} />
      </div>

      <div aria-hidden="true" className="hidden border-t border-line desktop:col-span-2 desktop:col-start-1 desktop:row-start-2 desktop:block" />

      <aside
        aria-label="Filtrar atividades"
        className={`desktop:col-start-1 desktop:row-start-3 desktop:pt-6 ${showFilter ? 'mb-3.5 desktop:mb-0' : 'hidden desktop:block'}`}
      >
        {hasTypes && (
          <div className={showFilter ? '' : 'hidden desktop:block'}>
            <p className="mb-2 hidden text-overline font-semibold uppercase tracking-[0.12em] text-brown-400 desktop:block">Tipo</p>
            <ChipFilter label="Tipo de atividade" options={options} selected={category} onSelect={setCategory} listOnDesktop />
          </div>
        )}
        <div className={`hidden desktop:block ${hasTypes ? 'mt-8' : ''}`}>
          <SchoolsPromo />
        </div>
      </aside>

      <div
        role="tabpanel"
        id={panelId(prefix, period)}
        aria-labelledby={tabId(prefix, period)}
        tabIndex={-1}
        className="desktop:col-start-2 desktop:row-start-3 desktop:pt-6"
      >
        {isPending && <p role="status" className="m-0 text-brown-400">Carregando a agenda…</p>}

        {isError && (
          <EmptyState
            tone="error"
            title="Não conseguimos carregar a agenda agora"
            text="A conexão pode ter falhado. Tente de novo em instantes."
            actions={
              <Button variant="secondary" size="compact" onClick={() => void refetch()}>
                Tentar de novo
              </Button>
            }
          />
        )}

        {events && events.length === 0 && period === 'upcoming' && (
          <EmptyState
            title="Nenhuma atividade marcada por enquanto"
            text="Acompanhe as novidades por onde preferir."
            actions={
              <>
                <Button variant="secondary" size="compact" href={CONTACTS.instagram}>
                  Instagram
                </Button>
                <Button variant="secondary" size="compact" href={CONTACTS.whatsapp}>
                  WhatsApp
                </Button>
              </>
            }
          />
        )}

        {events && events.length === 0 && period === 'past' && (
          <EmptyState title="Ainda não há registro de atividades passadas por aqui" />
        )}

        {events && events.length > 0 && <EventList events={visible} period={period} nextEventId={events[0]?.id} />}
      </div>
    </Container>
  )
}
