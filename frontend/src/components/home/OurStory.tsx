import { Button } from '../ui'

// Sankofa up front, and who idealized the ateliê (designs 14a and 14b). The phone has no long paragraph and a shorter line about the
// couple, so both texts are in the page and the screen size decides which one shows.
export function OurStory() {
  return (
    <section
      aria-label="Nossa história"
      className="mt-11 flex flex-col desktop:mx-auto desktop:mt-0 desktop:grid desktop:w-full desktop:max-w-page desktop:grid-cols-[27.5rem_minmax(0,1fr)] desktop:items-center desktop:gap-18 desktop:px-8 desktop:pt-22"
    >
      <img
        src="/images/hero-portrait.jpg"
        alt="Wil Oliveira em cena, com saia de palha, tocando berimbau."
        width={800}
        height={1000}
        loading="lazy"
        className="block aspect-square w-full object-cover object-[center_25%] desktop:aspect-[4/5] desktop:object-center desktop:shadow-[-10px_10px_0_var(--color-ochre)]"
      />
      <div className="flex flex-col desktop:gap-4.5">
        <div className="relative mx-4 -mt-14 flex flex-col gap-3 border-[1.5px] border-brown bg-ochre p-5 desktop:mx-0 desktop:mt-0 desktop:gap-4.5 desktop:border-0 desktop:bg-transparent desktop:p-0">
          <p className="m-0 text-overline leading-[normal] font-bold uppercase tracking-[0.12em] text-brown desktop:text-ochre-deep">Sankofa</p>
          <p className="m-0 text-[1.375rem] leading-[1.35] text-pretty italic desktop:text-[1.75rem] desktop:leading-[1.4]">“Nunca é tarde para voltar e apanhar aquilo que ficou para trás.”</p>
        </div>
        <div className="flex flex-col gap-2 px-4 pt-4.5 desktop:gap-4.5 desktop:p-0">
          <p className="m-0 hidden text-[1.09375rem] leading-[1.65] text-brown-600 desktop:block">
            Sankofa é um símbolo africano representado por um pássaro que volta a cabeça à sua cauda, da filosofia do povo Akan, de Gana. É essa ideia que dá origem ao Ateliê Afro Cultural.
          </p>
          <div className="flex flex-col gap-2 desktop:border-t-[1.5px] desktop:border-brown desktop:pt-4.5">
            <span className="text-[1.0625rem] leading-[normal] font-bold desktop:text-[1.125rem]">Wil Oliveira e Nathália (Nathy) Monteiro</span>
            <p className="m-0 text-[0.96875rem] leading-[1.6] text-brown-600 desktop:text-[1.03125rem]">
              <span className="desktop:hidden">Casal de artistas, idealizadores do ateliê. Sede na Casa Verde desde janeiro de 2020.</span>
              <span className="hidden desktop:inline">Um casal de artistas, idealizadores da instituição. O ateliê ganhou sede na Casa Verde em janeiro de 2020.</span>
            </p>
          </div>
          <Button to="/quem-somos" variant="secondary" className="min-h-12 text-[0.9375rem] desktop:self-start desktop:px-5">
            Conhecer quem somos
          </Button>
        </div>
      </div>
    </section>
  )
}
