import { StripedBand } from '../ui'

export function SankofaSection() {
  return (
    <>
      <section id="sankofa" aria-labelledby="sankofa-title" className="mt-3 flex scroll-mt-32 desktop:scroll-mt-40 flex-col gap-4 bg-brown px-5 pt-8 pb-7.5 text-cream">
        <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-4">
          <div className="grid size-24 place-items-center border-[1.5px] border-dashed border-brown-300 p-1.5 text-center text-[0.6875rem] leading-[1.3] font-semibold text-cream-dim">
            <span>
              Símbolo Sankofa
              <br />
              (arte da ONG)
            </span>
          </div>
          <div>
            <p className="m-0 text-overline font-semibold uppercase tracking-[0.12em] text-ochre">De onde vem o nome</p>
            <h2 id="sankofa-title" className="m-0 mt-1 text-[1.75rem] font-bold">
              Sankofa
            </h2>
          </div>
        </div>
        <p className="m-0 text-[1.375rem] leading-[1.4] text-pretty text-cream italic">
          "Nunca é tarde para voltar e apanhar aquilo que ficou para trás."
        </p>
        <p className="m-0 text-[0.96875rem] leading-[1.6] text-cream-dim">
          Sankofa é um símbolo africano representado por um pássaro que volta a cabeça à sua cauda, da filosofia do povo Akan, de
          Gana. É essa ideia que dá origem ao Ateliê Afro Cultural.
        </p>
      </section>
      <StripedBand />
    </>
  )
}
