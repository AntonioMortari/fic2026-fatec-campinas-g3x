import { cn } from '../../lib/cn'
import { SECTORS, type SectorKey } from '../../lib/sectors'

// Each sector has its own colour (the top edge and the number), as in design 15a and 15b.
const DETAILS: Record<SectorKey, { number: string; edge: string; tone: string; text: string; tags?: string[] }> = {
  literary: {
    number: '01',
    edge: 'border-t-ochre',
    tone: 'text-ochre-deep',
    text: 'Livros da temática negra: leituras, pesquisas, reflexões, contação de histórias e técnicas de teatro.',
  },
  musical: {
    number: '02',
    edge: 'border-t-blue',
    tone: 'text-blue-deep',
    text: 'Contato direto com a musicalidade afro-brasileira: cantigas, instrumentos e corporeidade negra, como os movimentos da capoeira.',
    tags: ['jongo', 'maculelê', 'maracatu', 'forró', 'samba', 'rap', 'hip hop', 'funk'],
  },
  artistic: {
    number: '03',
    edge: 'border-t-brown',
    tone: 'text-brown-400',
    text: 'Pintura em tela, materiais reciclados para figurinos e cenários, desenho, escultura e colagem.',
  },
}

export function SectorsSection() {
  return (
    <section id="setores" aria-labelledby="sectors-title" className="mx-auto flex w-full max-w-page scroll-mt-32 flex-col gap-3.5 px-4 pt-11 desktop:scroll-mt-40 desktop:gap-6 desktop:px-8 desktop:pt-24">
      <div className="flex flex-col gap-1.5">
        <p className="m-0 text-[0.6875rem] leading-[normal] font-bold uppercase tracking-[0.12em] text-ochre-deep desktop:text-overline">O que fazemos</p>
        <h2 id="sectors-title" className="m-0 text-[1.625rem] leading-[1.12] font-bold desktop:text-[2.5rem]">
          Nossos três setores
        </h2>
      </div>
      <ul className="m-0 flex list-none flex-col gap-3.5 p-0 desktop:grid desktop:grid-cols-3 desktop:items-stretch desktop:gap-6">
        {SECTORS.map((sector) => {
          const detail = DETAILS[sector.key]
          return (
            <li key={sector.key} className={cn('flex flex-col border-[1.5px] border-t-[6px] border-brown bg-card', detail.edge)}>
              <img src={sector.image} alt={sector.alt} width={1000} height={500} loading="lazy" className="block aspect-[2/1] w-full border-b-[1.5px] border-brown object-cover desktop:aspect-[3/2]" />
              <div className="flex flex-col gap-2 px-4 pt-3.5 pb-4 desktop:gap-2.5 desktop:px-5.5 desktop:pt-5 desktop:pb-6">
                <span className={cn('text-[0.8125rem] leading-[normal] font-bold desktop:text-[0.875rem]', detail.tone)}>{detail.number}</span>
                <h3 className="m-0 text-[1.25rem] leading-[normal] font-bold desktop:text-[1.5rem]">{sector.title}</h3>
                <p className="m-0 text-[0.9375rem] leading-[1.55] text-brown-600 desktop:text-[1rem] desktop:leading-[1.6]">{detail.text}</p>
                {detail.tags && (
                  <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0 desktop:pt-1">
                    {detail.tags.map((tag) => (
                      <li key={tag} className="bg-cream-dark leading-[normal] px-2.25 py-1 text-[0.78125rem] font-semibold desktop:text-[0.8125rem]">
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
