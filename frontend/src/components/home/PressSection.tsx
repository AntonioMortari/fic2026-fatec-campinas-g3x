import type { ReactNode } from 'react'
import { PRESS_FEATURED, PRESS_OTHERS, type PressFeatured, type PressItem } from '../../lib/press'
import { Container } from '../ui'

const OVERLINE = 'text-[0.71875rem] leading-[normal] font-bold uppercase tracking-[0.12em] desktop:text-[0.8125rem]'

function Original({ url, children, className }: { url?: string; children: ReactNode; className: string }) {
  if (!url) return null
  return (
    <a href={url} target="_blank" rel="noreferrer" className={className}>
      {children} <span aria-hidden="true">↗</span>
      <span className="sr-only"> (abre em outra aba)</span>
    </a>
  )
}

// "Na mídia" (designs 14a and 14b): the Folha story as the highlight, the Globo appearance beside it, text only. The link of each piece
// shows only when it exists; today none does, so the section is the facts and no link.
export function PressSection({ featured = PRESS_FEATURED, others = PRESS_OTHERS }: { featured?: PressFeatured | null; others?: PressItem[] }) {
  if (!featured && others.length === 0) return null

  return (
    <Container as="section" aria-labelledby="press-title" className="flex flex-col gap-3.5 pt-11 desktop:gap-5 desktop:pt-20">
      <h2 id="press-title" className="m-0 text-[1.5rem] leading-[1.15] font-bold desktop:text-[1.75rem] desktop:leading-[normal]">
        Na mídia
      </h2>
      <div className="flex flex-col border-[1.5px] border-brown bg-card desktop:grid desktop:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {featured && (
          <div className="flex flex-col gap-2.5 border-b-[1.5px] border-brown p-5 desktop:gap-4 desktop:border-r-[1.5px] desktop:border-b-0 desktop:p-8">
            <p className={`m-0 text-ochre-deep ${OVERLINE}`}>{featured.outlet}</p>
            <p className="m-0 text-[1.3125rem] leading-[1.3] font-bold text-pretty desktop:text-[1.875rem] desktop:leading-[1.25]">“{featured.quote}”</p>
            <Original url={featured.url} className="mt-auto flex min-h-11 items-center gap-2 text-[0.9375rem] font-semibold text-blue-deep underline">
              {featured.action}
            </Original>
          </div>
        )}
        <div className="flex flex-col">
          {others.map((item, index) => (
            <div
              key={item.title}
              className={`flex min-h-18 flex-1 flex-col gap-0.5 px-5 py-3 desktop:min-h-0 desktop:gap-2 desktop:px-7 desktop:py-6 ${index > 0 ? 'border-t-[1.5px] border-brown' : ''}`}
            >
              <p className={`m-0 text-blue-deep ${OVERLINE}`}>{`${item.outlet} · ${item.year}`}</p>
              <p className="m-0 text-[1.0625rem] leading-[1.25] font-bold desktop:text-[1.3125rem]">{item.title}</p>
              <p className="m-0 text-[0.875rem] leading-[1.5] text-brown-600 desktop:text-[0.9375rem]">{item.detail}</p>
              <Original url={item.url} className="mt-auto flex min-h-11 items-center gap-2 text-[0.90625rem] font-semibold text-blue-deep underline">
                {item.action}
              </Original>
            </div>
          ))}
        </div>
      </div>
    </Container>
  )
}
