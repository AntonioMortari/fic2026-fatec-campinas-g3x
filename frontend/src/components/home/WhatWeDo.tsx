import { Link } from 'react-router-dom'
import { SECTORS, type SectorKey } from '../../lib/sectors'

const SUMMARIES: Record<SectorKey, string> = {
  literary: 'Livros de temática negra, leituras, contação de histórias e teatro.',
  musical: 'Jongo, maculelê, maracatu, samba, rap, hip hop e funk.',
  artistic: 'Pintura, figurinos reciclados, desenho, escultura e colagem.',
}

// Design 14a: three cards side by side. Design 14b: the cards slide sideways, and the heading says so.
export function WhatWeDo() {
  return (
    <section aria-labelledby="what-we-do-title" className="mx-auto w-full max-w-page pt-10 desktop:px-8 desktop:pt-18">
      <div className="mb-3.5 flex items-baseline justify-between gap-4 px-4 desktop:mb-5 desktop:px-0">
        <h2 id="what-we-do-title" className="m-0 text-[1.5rem] leading-[1.15] font-bold desktop:text-[1.75rem] desktop:leading-[normal]">
          O que fazemos
        </h2>
        <Link to="/quem-somos" className="hidden text-[0.9375rem] font-semibold text-blue-deep underline desktop:inline">
          Ler nossa história completa →
        </Link>
        <span aria-hidden="true" className="text-[0.8125rem] font-semibold text-brown-400 desktop:hidden">
          deslize →
        </span>
      </div>
      <ul
        tabIndex={0}
        aria-label="Setores do ateliê"
        className="m-0 flex list-none snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1.5 [scrollbar-width:none] desktop:grid desktop:grid-cols-3 desktop:gap-5 desktop:overflow-visible desktop:p-0"
      >
        {SECTORS.map((sector) => (
          <li key={sector.key} className="flex w-75 flex-none snap-start flex-col border-[1.5px] border-brown bg-card desktop:w-auto desktop:border desktop:border-brown/30">
            <img src={sector.image} alt={sector.alt} width={1000} height={500} loading="lazy" className="block aspect-[4/3] w-full border-b-[1.5px] border-brown object-cover desktop:aspect-[3/2] desktop:border-b-0" />
            <div className="flex flex-col gap-1.5 px-4 pt-3.5 pb-4.5 desktop:px-4.5 desktop:pt-4 desktop:pb-5">
              <h3 className="m-0 text-[1.1875rem] leading-[normal] font-bold desktop:text-[1.25rem]">{sector.title}</h3>
              <p className="m-0 text-[0.90625rem] leading-[1.5] text-brown-600 desktop:text-[0.9375rem]">{SUMMARIES[sector.key]}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
