import { cn } from '../../lib/cn'

const SKILLS = ['Contação de histórias', 'Dança', 'Música', 'Atuação', 'Escrita']

const MILESTONES = [
  { title: 'Janeiro de 2020', text: 'O ateliê ganha sede na Casa Verde, segundo a Folha de S.Paulo.', marker: 'bg-ochre' },
  {
    title: 'Rede nacional',
    text: 'O casal participa do Caldeirão do Huck, na Rede Globo, na véspera do Dia Internacional Contra a Discriminação Racial.',
    marker: 'bg-brown',
  },
]

export function FoundersSection() {
  return (
    <section id="quem-idealizou" aria-labelledby="founders-title" className="flex scroll-mt-32 desktop:scroll-mt-40 flex-col gap-4 px-4 pt-9 desktop:px-0">
      <p className="m-0 text-overline font-semibold uppercase tracking-[0.12em] text-ochre-deep">Quem idealizou</p>
      <div className="grid aspect-[4/3] place-items-center border-[1.5px] border-dashed border-brown-300 bg-cream-dark text-small font-semibold text-brown-400">
        Foto de Wil e Nathy
      </div>
      <h2 id="founders-title" className="m-0 text-[1.625rem] leading-[1.15] font-bold">
        Wil Oliveira e Nathália (Nathy) Monteiro
      </h2>
      <p className="m-0 text-body leading-[1.6]">
        Um casal de artistas. Juntos somam pesquisa sobre a cultura afro-brasileira, contação de histórias, cultura popular
        brincante, dança, música, atuação e escrita.
      </p>
      <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
        {SKILLS.map((skill) => (
          <li key={skill} className="border border-line bg-card px-2.5 py-1.5 text-[0.8125rem] font-semibold">
            {skill}
          </li>
        ))}
      </ul>
      <ol className="m-0 mt-2 flex list-none flex-col border-l-2 border-ochre p-0">
        {MILESTONES.map((milestone, index) => (
          <li key={milestone.title} className={cn('relative pl-5', index < MILESTONES.length - 1 && 'pb-4.5')}>
            <span aria-hidden="true" className={cn('absolute top-1 -left-1.75 size-3', milestone.marker)} />
            <span className="block text-[0.9375rem] font-bold text-ochre-deep">{milestone.title}</span>
            <span className="text-[0.9375rem] leading-normal">{milestone.text}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
