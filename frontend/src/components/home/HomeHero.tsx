import { Link } from 'react-router-dom'
import { Button } from '../ui'

// Design 14a: the card with the sentence on the left, over the edge of the photo; 14b: the photo on top and the card over its lower edge.
export function HomeHero() {
  return (
    <section aria-labelledby="home-title" className="mx-auto w-full max-w-page desktop:grid desktop:grid-cols-[36.25rem_minmax(0,1fr)] desktop:px-8 desktop:pt-14">
      <img
        src="/images/hero.jpg"
        alt="Wil Oliveira, cofundador do Ateliê Afro Cultural, toca um atabaque ao lado do estandarte bordado da instituição."
        width={1200}
        height={675}
        className="block aspect-[4/3] w-full object-cover desktop:col-start-2 desktop:row-start-1 desktop:aspect-auto desktop:h-130 desktop:border-[1.5px] desktop:border-brown"
      />
      <div className="relative z-10 mx-4 -mt-12 flex flex-col gap-3 border-[1.5px] border-brown bg-card p-5 shadow-applique-hero desktop:col-start-1 desktop:row-start-1 desktop:mx-0 desktop:mt-0 desktop:-mr-10 desktop:gap-4.5 desktop:self-start desktop:p-10 desktop:shadow-applique-hero-desktop">
        <p className="m-0 text-[0.6875rem] leading-[normal] font-bold uppercase tracking-[0.12em] text-ochre-deep desktop:text-overline">Casa Verde · São Paulo</p>
        <h1 id="home-title" className="m-0 [overflow-wrap:anywhere] text-[1.875rem] leading-[1.1] font-bold desktop:text-[3.375rem] desktop:leading-[1.08]">
          Arte, memória e <em className="text-ochre-deep not-italic">pertencimento</em> — feitos à mão, todo dia
        </h1>
        <p className="m-0 text-[0.96875rem] leading-[1.55] text-brown-600 desktop:text-[1.125rem] desktop:leading-[1.6]">
          Espaço educativo de criação, reflexão e valorização da cultura e memória afro brasileira, na zona norte de São Paulo.
        </p>
        <div className="flex flex-col gap-3 desktop:flex-row desktop:items-center desktop:gap-5 desktop:pt-1.5">
          <Button to="/projetos" fullWidth className="min-h-12.5 text-[0.96875rem] desktop:w-auto desktop:min-h-13 desktop:px-6 desktop:text-[1rem]">
            Conhecer nossos projetos
          </Button>
          <Link to="/agenda" className="flex min-h-11 items-center justify-center font-semibold text-blue-deep underline desktop:inline-flex desktop:text-[1rem]">
            Ver a agenda →
          </Link>
        </div>
      </div>
    </section>
  )
}
