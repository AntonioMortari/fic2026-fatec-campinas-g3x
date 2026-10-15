import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { Container } from '../ui'

// Four cards with their own colour on the top edge (designs 14a and 14b); the last one, "Apoiar", is the dark one.
const PATHS = [
  { number: '01', title: 'Conhecer', description: 'Nossa história e os três setores.', action: 'Quem somos', to: '/quem-somos', edge: 'border-t-ochre', numberTone: 'text-ochre-deep' },
  { number: '02', title: 'Participar', description: 'Oficinas e vivências. Inscrição sem cadastro.', action: 'Ver a agenda', to: '/agenda', edge: 'border-t-blue', numberTone: 'text-blue-deep' },
  { number: '03', title: 'Ser voluntário', description: 'Cinco áreas, do pedagógico ao acervo.', action: 'Áreas de atuação', to: '/voluntariado', edge: 'border-t-brown-400', numberTone: 'text-brown-400' },
  { number: '04', title: 'Apoiar', description: 'Recursos para manter as atividades, a equipe e os materiais.', action: 'Como apoiar', to: '/doar', edge: 'border-t-ochre', numberTone: 'text-ochre', dark: true },
] as const

export function StartingPoints() {
  return (
    <Container as="section" aria-labelledby="starting-points-title" className="flex flex-col gap-3.5 pt-10 desktop:gap-5 desktop:pt-16">
      <h2 id="starting-points-title" className="m-0 text-[1.5rem] leading-[1.15] font-bold desktop:text-[1.75rem] desktop:leading-[normal]">
        Por onde começar
      </h2>
      <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2.5 desktop:grid-cols-4 desktop:gap-5">
        {PATHS.map((path) => (
          <Link
            key={path.number}
            to={path.to}
            className={cn(
              'group flex min-h-37.5 min-w-0 flex-col gap-1.5 border-[1.5px] border-t-[6px] border-brown p-3.5 [overflow-wrap:anywhere] no-underline desktop:min-h-50 desktop:gap-2.5 desktop:p-5',
              path.edge,
              'dark' in path ? 'bg-brown text-cream hover:text-cream' : 'bg-card text-brown hover:text-brown',
            )}
          >
            <span className={cn('text-[0.8125rem] leading-[normal] font-bold desktop:text-[0.875rem]', path.numberTone)}>{path.number}</span>
            <span className="text-[1.125rem] leading-[1.2] font-bold desktop:text-[1.375rem]">{path.title}</span>
            <span className={cn('text-[0.84375rem] leading-[1.45] desktop:text-[0.9375rem] desktop:leading-[1.5]', 'dark' in path ? 'text-cream-dim' : 'text-brown-600')}>{path.description}</span>
            <span className="mt-auto flex items-center gap-2 text-[0.9375rem] leading-[normal] font-semibold">
              <span className="hidden desktop:inline">{path.action}</span>
              <span aria-hidden="true" className="size-2 rotate-45 border-t-2 border-r-2 border-current transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </Container>
  )
}
