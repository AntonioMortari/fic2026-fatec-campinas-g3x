import { cn } from '../../lib/cn'

const SKILLS = ['Pesquisa', 'Contação de histórias', 'Cultura popular brincante', 'Dança', 'Música', 'Atuação', 'Escrita']

const MILESTONES = [
  { title: 'Janeiro de 2020', text: 'O ateliê ganha sede na Casa Verde.', marker: 'bg-ochre' },
  {
    title: 'Rede nacional',
    text: 'O casal participa do Caldeirão do Huck, na Rede Globo, na véspera do Dia Internacional Contra a Discriminação Racial.',
    marker: 'bg-brown',
  },
]

const OVERLINE = 'm-0 text-[0.6875rem] leading-[normal] font-bold uppercase tracking-[0.12em] text-ochre-deep desktop:text-overline'
const NAME = 'Wil Oliveira e Nathália (Nathy) Monteiro'
const SHORT = 'Um casal de artistas e os idealizadores da instituição. Juntos somam pesquisa sobre a cultura afro-brasileira e a cultura popular:'
const LONG =
  'Um casal de artistas e os idealizadores da instituição. Juntos somam habilidades artísticas como pesquisa acerca da cultura afro-brasileira, contação de histórias, brincantes de cultura popular, dança, música, atuação e escrita, sempre envolvendo a temática afro-brasileira e a cultura popular.'

function Skills() {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0 desktop:gap-2">
      {SKILLS.map((skill) => (
        <li key={skill} className="border border-brown/30 bg-card leading-[normal] px-2.5 py-1.5 text-[0.8125rem] font-semibold desktop:px-3 desktop:py-1.75 desktop:text-[0.875rem]">
          {skill}
        </li>
      ))}
    </ul>
  )
}

// The photo of the couple was not sent: the placeholder stays, and the text takes the whole row if it ever goes (design "Tweaks").
export function FoundersSection({ desktop }: { desktop: boolean }) {
  if (desktop) {
    return (
      <section id="quem-idealizou" aria-labelledby="founders-title" className="mx-auto grid w-full max-w-page scroll-mt-40 grid-cols-[25rem_minmax(0,1fr)] items-start gap-18 px-8 pt-24">
        <div className="grid aspect-[4/5] place-items-center border-[1.5px] border-dashed border-brown-300 bg-cream-dark text-[0.9375rem] font-semibold text-brown-400">Foto de Wil e Nathy</div>
        <div className="flex flex-col gap-5">
          <p className={OVERLINE}>Quem idealizou</p>
          <h2 id="founders-title" className="m-0 text-[2.5rem] leading-[1.12] font-bold text-pretty">
            {NAME}
          </h2>
          <p className="m-0 max-w-160 text-[1.125rem] leading-[1.65] text-brown-600">{LONG}</p>
          <Skills />
          <ol className="m-0 mt-4 grid list-none grid-cols-2 gap-6 border-t-2 border-ochre p-0">
            {MILESTONES.map((milestone) => (
              <li key={milestone.title} className="relative flex flex-col gap-1.5 pt-6">
                <span aria-hidden="true" className={cn('absolute -top-1.75 left-0 size-3', milestone.marker)} />
                <span className="text-[1rem] leading-[normal] font-bold text-ochre-deep">{milestone.title}</span>
                <span className="text-[1.03125rem] leading-[1.55]">{milestone.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    )
  }
  return (
    <section id="quem-idealizou" aria-labelledby="founders-title" className="flex scroll-mt-32 flex-col gap-4 px-4 pt-10 desktop:scroll-mt-40">
      <p className={OVERLINE}>Quem idealizou</p>
      <div className="grid aspect-[4/3] place-items-center border-[1.5px] border-dashed border-brown-300 bg-cream-dark text-[0.875rem] font-semibold text-brown-400">Foto de Wil e Nathy</div>
      <h2 id="founders-title" className="m-0 text-[1.625rem] leading-[1.15] font-bold">
        {NAME}
      </h2>
      <p className="m-0 text-body leading-[1.6]">{SHORT}</p>
      <Skills />
      <ol className="m-0 mt-2 flex list-none flex-col border-l-2 border-ochre p-0">
        {MILESTONES.map((milestone, index) => (
          <li key={milestone.title} className={cn('relative flex flex-col gap-0.5 pl-5', index < MILESTONES.length - 1 && 'pb-4.5')}>
            <span aria-hidden="true" className={cn('absolute top-1 -left-1.75 size-3', milestone.marker)} />
            <span className="text-[0.9375rem] leading-[normal] font-bold text-ochre-deep">{milestone.title}</span>
            <span className="text-[0.9375rem] leading-normal">{milestone.text}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
