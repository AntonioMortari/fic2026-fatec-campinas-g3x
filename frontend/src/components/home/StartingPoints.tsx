import { ListItem } from '../ui'

const PATHS = [
  { number: '01', tone: 'ochre', title: 'Conhecer', description: 'Nossa história e os três setores.', to: '/quem-somos' },
  { number: '02', tone: 'blue', title: 'Participar', description: 'Oficinas e vivências. Inscrição sem cadastro.', to: '/agenda' },
  { number: '03', tone: 'brown', title: 'Ser voluntário', description: 'Cinco áreas, do pedagógico ao acervo.', to: '/voluntariado' },
  { number: '04', tone: 'ochre', title: 'Apoiar', description: 'Livros, instrumentos, materiais e recursos.', to: '/doar' },
] as const

export function StartingPoints({ wide }: { wide: boolean }) {
  return (
    <section aria-labelledby="starting-points-title" className="flex flex-col desktop:gap-1.5">
      <h2 id="starting-points-title" className="m-0 mb-1.5 text-h2 font-bold desktop:mb-2 desktop:text-h2-desktop">
        Por onde começar
      </h2>
      <ul className={wide ? 'm-0 list-none p-0 desktop:grid desktop:grid-cols-4 desktop:gap-x-8' : 'm-0 list-none p-0 desktop:grid desktop:grid-cols-2 desktop:gap-x-8'}>
        {PATHS.map((path) => (
          <ListItem
            key={path.number}
            {...path}
            className={
              wide
                ? 'desktop:border-y desktop:last:border-b'
                : 'desktop:border-t desktop:border-b-0 desktop:[&:nth-last-child(-n+2)]:border-b'
            }
          />
        ))}
      </ul>
    </section>
  )
}
