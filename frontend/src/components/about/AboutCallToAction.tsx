import { Link } from 'react-router-dom'
import { PROJECTS, SUPPORT, VOLUNTEER } from '../../lib/navigation'

const OUTLINE =
  'flex min-h-12 items-center justify-center border-[1.5px] border-cream text-[0.9375rem] font-semibold text-cream no-underline hover:text-cream'

export function AboutCallToAction() {
  return (
    <section aria-labelledby="about-cta-title" className="mt-10 bg-brown px-5 py-7 text-cream">
      <div className="flex flex-col gap-3 desktop:mx-auto desktop:max-w-[45rem]">
        <h2 id="about-cta-title" className="m-0 text-[1.375rem] leading-[1.25] font-bold">
          Quer fazer parte desta história?
        </h2>
        <Link to={PROJECTS.to} className="flex min-h-13 items-center justify-center bg-ochre text-body font-semibold text-brown no-underline hover:text-brown">
          Conhecer nossos projetos
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <Link to={VOLUNTEER.to} className={OUTLINE}>
            Ser voluntário
          </Link>
          <Link to={SUPPORT.to} className={OUTLINE}>
            Apoiar
          </Link>
        </div>
      </div>
    </section>
  )
}
