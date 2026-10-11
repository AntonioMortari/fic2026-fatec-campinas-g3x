import { cn } from '../../lib/cn'
import { SECTORS, type SectorKey } from '../../lib/sectors'

const DETAILS: Record<SectorKey, { number: string; tone: string; text: string; tags?: string[] }> = {
  literary: {
    number: '01',
    tone: 'text-ochre-deep',
    text: 'Livros da temática negra: leituras, pesquisas, reflexões, contação de histórias e técnicas de teatro.',
  },
  musical: {
    number: '02',
    tone: 'text-blue-deep',
    text: 'Contato direto com a musicalidade afro-brasileira: cantigas, instrumentos e corporeidade negra, como os movimentos da capoeira.',
    tags: ['jongo', 'maculelê', 'maracatu', 'forró', 'samba', 'rap', 'hip hop', 'funk'],
  },
  artistic: {
    number: '03',
    tone: 'text-brown-400',
    text: 'Pintura em tela, materiais reciclados para figurinos e cenários, desenho, escultura e colagem.',
  },
}

export function SectorsSection() {
  return (
    <section
      id="setores"
      aria-labelledby="sectors-title"
      className="flex scroll-mt-32 desktop:scroll-mt-40 flex-col gap-3.5 pt-10 desktop:mx-auto desktop:max-w-page desktop:px-8"
    >
      <div className="px-4 desktop:px-0">
        <p className="m-0 text-overline font-semibold uppercase tracking-[0.12em] text-ochre-deep">O que fazemos</p>
        <h2 id="sectors-title" className="m-0 mt-1 text-[1.625rem] font-bold">
          Nossos três setores
        </h2>
      </div>
      <ul className="m-0 flex list-none flex-col gap-3 px-4 desktop:grid desktop:grid-cols-3 desktop:gap-6 desktop:px-0">
        {SECTORS.map((sector) => {
          const detail = DETAILS[sector.key]
          return (
            <li key={sector.key} className="border border-line bg-card">
              <img src={sector.image} alt={sector.alt} width={1000} height={500} loading="lazy" className="block aspect-[2/1] w-full object-cover" />
              <div className="flex flex-col gap-1.5 px-4 pt-3.5 pb-4">
                <span className={cn('text-[0.8125rem] font-bold', detail.tone)}>{detail.number}</span>
                <h3 className="m-0 text-[1.25rem] font-bold">{sector.title}</h3>
                <p className="m-0 text-[0.9375rem] leading-[1.55] text-brown-600">{detail.text}</p>
                {detail.tags && (
                  <ul className="m-0 mt-0.5 flex list-none flex-wrap gap-1.5 p-0">
                    {detail.tags.map((tag) => (
                      <li key={tag} className="bg-cream-dark px-2.25 py-1 text-[0.78125rem] font-semibold">
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
