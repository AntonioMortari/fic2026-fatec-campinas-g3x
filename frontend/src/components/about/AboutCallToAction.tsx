import { Link } from 'react-router-dom'
import { PROJECTS, SUPPORT, VOLUNTEER } from '../../lib/navigation'

const BASE = 'flex items-center justify-center px-2 text-center [overflow-wrap:anywhere] no-underline'

// A card with a hard shadow (designs 15a and 15b), not a band: the only band of the bottom of the page is the footer's. The space
// below it is the design's 96px (44px on the phone) between the card and that band.
export function AboutCallToAction() {
  return (
    <div className="mx-4 mt-11 mb-11 desktop:mx-auto desktop:mt-24 desktop:mb-24 desktop:w-[calc(100%-4rem)] desktop:max-w-[75rem]">
      <section
        aria-labelledby="about-cta-title"
        className="flex flex-col gap-3 border-[1.5px] border-brown bg-card px-4.5 py-5.5 shadow-applique-hero desktop:grid desktop:grid-cols-[minmax(0,1fr)_auto] desktop:items-center desktop:gap-10 desktop:px-10 desktop:py-9 desktop:shadow-applique-hero-desktop"
      >
        <h2 id="about-cta-title" className="m-0 text-[1.375rem] leading-[1.25] font-bold desktop:text-[2rem] desktop:leading-[1.2]">
          Quer fazer parte desta história?
        </h2>
        <div className="flex flex-col gap-3 desktop:flex-row">
          <Link to={PROJECTS.to} className={`${BASE} min-h-13 bg-brown text-body font-semibold text-cream hover:text-cream desktop:px-6`}>
            Conhecer nossos projetos
          </Link>
          <div className="grid grid-cols-2 gap-2 desktop:flex desktop:gap-3">
            <Link to={VOLUNTEER.to} className={`${BASE} min-h-12 border-[1.5px] border-brown text-[0.9375rem] font-semibold text-brown hover:text-brown desktop:min-h-13 desktop:px-5 desktop:text-body`}>
              Ser voluntário
            </Link>
            <Link to={SUPPORT.to} className={`${BASE} min-h-12 border-[1.5px] border-brown bg-ochre text-[0.9375rem] font-bold text-brown hover:text-brown desktop:min-h-13 desktop:px-5 desktop:text-body`}>
              Apoiar
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
