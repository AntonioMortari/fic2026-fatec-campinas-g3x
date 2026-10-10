import { Link } from 'react-router-dom'
import { Button } from '../ui'

export function HomeHero() {
  return (
    <section aria-labelledby="home-title" className="desktop:mx-auto desktop:grid desktop:max-w-page desktop:grid-cols-[5fr_7fr] desktop:items-center desktop:px-8 desktop:pt-14">
      <img
        src="/images/hero.jpg"
        alt="Wil Oliveira, cofundador do Ateliê Afro Cultural, toca um atabaque ao lado do estandarte bordado da instituição."
        width={1200}
        height={675}
        className="block aspect-[4/3] w-full object-cover desktop:col-start-2 desktop:row-start-1 desktop:border-[1.5px] desktop:border-brown"
      />
      <div className="relative z-10 mx-4 -mt-14 flex flex-col gap-3 border-[1.5px] border-brown bg-card px-5 pt-5.5 pb-5 shadow-applique-hero desktop:col-start-1 desktop:row-start-1 desktop:mx-0 desktop:-mr-20 desktop:mt-0 desktop:gap-4 desktop:p-10 desktop:shadow-applique-hero-desktop">
        <p className="m-0 text-overline font-semibold uppercase tracking-[0.12em] text-ochre-deep desktop:text-[0.8125rem]">
          Casa Verde · São Paulo
        </p>
        <h1 id="home-title" className="m-0 [overflow-wrap:anywhere] text-[1.875rem] leading-[1.12] font-bold text-pretty desktop:text-[3.25rem] desktop:leading-[1.06]">
          Arte, memória e <em className="text-ochre-deep not-italic">pertencimento</em> — feitos à mão, todo dia
        </h1>
        <p className="m-0 text-body text-brown-600 desktop:text-[1.1875rem]">
          Espaço educativo de criação, reflexão e valorização da cultura e memória afro brasileira
          <span className="hidden desktop:inline">, na zona norte de São Paulo</span>.
        </p>
        <div className="mt-1.5 flex flex-col gap-3 desktop:mt-2 desktop:flex-row desktop:items-center">
          <Button to="/projetos" fullWidth className="desktop:w-auto desktop:min-h-13.5 desktop:px-6.5 desktop:text-[1.0625rem]">
            Conhecer nossos projetos
          </Button>
          <Link to="/agenda" className="hidden min-h-11 items-center px-2.5 font-semibold desktop:inline-flex">
            Ver a agenda →
          </Link>
        </div>
      </div>
    </section>
  )
}
