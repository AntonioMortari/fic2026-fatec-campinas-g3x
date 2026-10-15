import type { ReactNode } from 'react'

const OVERLINE = 'm-0 text-overline leading-[normal] font-bold uppercase tracking-[0.12em] text-ochre-deep'
const ALT = 'Wil Oliveira em cena, com saia de palha, tocando berimbau.'

function Sentence({ className }: { className: string }) {
  return (
    <h1 className={className}>
      Um espaço educativo de <em className="text-ochre-deep not-italic">reflexão, criação</em> e valorização da cultura e memória afro-brasileira
    </h1>
  )
}

// Design 15a: the sentence on the left with the index under it, the photo on the right on an ochre shadow. Design 15b: the photo
// on top, the card with the sentence over its lower edge, and the index (a separate sticky bar) after it.
export function AboutHero({ desktop, index }: { desktop: boolean; index: ReactNode }) {
  if (desktop) {
    return (
      <section className="mx-auto grid w-full max-w-page grid-cols-[minmax(0,1fr)_28.75rem] items-center gap-18 px-8 pt-16">
        <div className="flex flex-col gap-5.5">
          <p className={OVERLINE}>Quem somos</p>
          <Sentence className="m-0 [overflow-wrap:anywhere] text-[3.5rem] leading-[1.08] font-bold text-pretty" />
          <p className="m-0 text-[1.1875rem] leading-[1.55] text-brown-600">Casa Verde, zona norte de São Paulo · sede desde janeiro de 2020</p>
          {index}
        </div>
        <img src="/images/hero-portrait.jpg" alt={ALT} width={800} height={1000} className="block aspect-[4/5] w-full border-[1.5px] border-brown object-cover shadow-[10px_10px_0_var(--color-ochre)]" />
      </section>
    )
  }
  return (
    <section>
      <img src="/images/hero-portrait.jpg" alt={ALT} width={800} height={1000} className="block aspect-[4/5] w-full object-cover" />
      <div className="relative mx-4 -mt-24 flex flex-col gap-3 border-[1.5px] border-brown bg-card px-5 py-5.5 shadow-applique-hero">
        <p className="m-0 text-[0.6875rem] leading-[normal] font-bold uppercase tracking-[0.12em] text-ochre-deep">Quem somos</p>
        <Sentence className="m-0 [overflow-wrap:anywhere] text-[1.8125rem] leading-[1.12] font-bold text-pretty" />
        <p className="m-0 text-[0.9375rem] leading-normal text-brown-600">Casa Verde, zona norte de São Paulo · desde 2020</p>
      </div>
    </section>
  )
}
