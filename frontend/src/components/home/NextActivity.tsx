import { Link } from 'react-router-dom'
import { canRegister, homeEventMeta } from '../../lib/events'
import type { EventSummary } from '../../types/event'
import { Button, DateBadge } from '../ui'

// Design 14a: one wide card, with the label on its left edge, the date, the text and the way in. Design 14b: the label above, and the
// card with the date and the text on top and the buttons below. The `contents` boxes let both be the same markup.
export function NextActivity({ event }: { event: EventSummary }) {
  const details = `/agenda/${event.id}`
  return (
    <section
      aria-labelledby="next-activity-title"
      className="flex flex-col gap-3 desktop:grid desktop:grid-cols-[auto_6.5rem_minmax(0,1fr)_15rem] desktop:items-center desktop:gap-7 desktop:border-[1.5px] desktop:border-brown desktop:bg-card desktop:px-6 desktop:py-5"
    >
      <h2
        id="next-activity-title"
        className="m-0 text-overline leading-[normal] font-bold uppercase tracking-[0.12em] text-ochre-deep desktop:rotate-180 desktop:tracking-[0.14em] desktop:[writing-mode:vertical-rl]"
      >
        Próxima atividade
      </h2>
      <article className="flex flex-col border-[1.5px] border-brown bg-card desktop:contents">
        <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3.5 p-4 desktop:contents">
          <DateBadge date={new Date(event.startsAt)} highlight size="home" />
          <div className="flex min-w-0 flex-col gap-1 desktop:gap-1.5">
            {event.category && <span className="text-[0.6875rem] leading-[normal] font-bold uppercase tracking-[0.1em] text-blue-deep desktop:text-xs">{event.category}</span>}
            <h3 className="m-0 text-[1.3125rem] leading-[1.2] font-bold desktop:text-[1.75rem] desktop:leading-[1.15]">{event.title}</h3>
            <span className="text-[0.875rem] leading-[1.45] text-brown-600 desktop:hidden">{homeEventMeta(event, 'short')}</span>
            <span className="hidden text-[1rem] leading-[normal] text-brown-600 desktop:inline">{homeEventMeta(event, 'long')}</span>
          </div>
        </div>
        {canRegister(event) ? (
          <div className="flex flex-wrap gap-2 px-4 pb-4 desktop:flex-col desktop:gap-2.5 desktop:p-0">
            <Button to={`${details}/inscricao`} variant="applique" className="min-h-12 min-w-0 flex-[1_1_10rem] text-[0.9375rem] desktop:min-h-13 desktop:flex-none desktop:text-[1rem]">
              Quero me inscrever
            </Button>
            <div className="contents desktop:flex desktop:items-center desktop:justify-between desktop:text-[0.90625rem] desktop:font-semibold desktop:[&>*]:flex-none">
              <Button to={details} variant="secondary" className="min-h-12 flex-auto px-3.5 text-[0.875rem] desktop:hidden">
                Detalhes
              </Button>
              <Link to={details} className="hidden desktop:inline">
                Ver detalhes
              </Link>
              <Link to="/agenda" className="hidden text-blue-deep underline desktop:inline">
                Toda a agenda →
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-4 desktop:flex-col desktop:items-stretch desktop:gap-2.5 desktop:p-0">
            {event.registrationStatus === 'full' && <span className="font-semibold text-brown-400 desktop:text-center">Vagas esgotadas</span>}
            <div className="flex items-center justify-between gap-3 text-[0.90625rem] font-semibold">
              <Link to={details}>
                <span className="desktop:hidden">Detalhes</span>
                <span className="hidden desktop:inline">Ver detalhes</span>
              </Link>
              <Link to="/agenda" className="hidden text-blue-deep underline desktop:inline">
                Toda a agenda →
              </Link>
            </div>
          </div>
        )}
      </article>
    </section>
  )
}
