import { StripedBand } from '../ui'

const OVERLINE = 'm-0 text-[0.6875rem] leading-[normal] font-bold uppercase tracking-[0.12em] text-ochre desktop:text-overline'
const PLACEHOLDER = 'grid place-items-center border-[1.5px] border-dashed border-brown-300 text-center font-semibold text-cream-dim'
const QUOTE = '“Nunca é tarde para voltar e apanhar aquilo que ficou para trás.”'
const MEANING =
  'Sankofa é um símbolo africano representado por um pássaro que volta a cabeça à sua cauda, da filosofia do povo Akan, de Gana. É essa ideia que dá origem ao Ateliê Afro Cultural.'

// The only dark band of the page (design 15a and 15b). The symbol is a placeholder: the art is the ONG's and was not sent.
export function SankofaSection({ desktop }: { desktop: boolean }) {
  return (
    <>
      <section id="sankofa" aria-labelledby="sankofa-title" className="mt-4 scroll-mt-32 bg-brown text-cream desktop:mt-24 desktop:scroll-mt-40">
        {desktop ? (
          <div className="mx-auto grid max-w-page grid-cols-[15rem_minmax(0,1fr)] items-center gap-18 px-8 py-18">
            <div className={`${PLACEHOLDER} size-60 p-4 text-[0.875rem] leading-[1.4]`}>
              <span>
                Símbolo Sankofa
                <br />
                (arte da ONG)
              </span>
            </div>
            <div className="flex max-w-[47.5rem] flex-col gap-4.5">
              <p className={OVERLINE}>De onde vem o nome</p>
              <h2 id="sankofa-title" className="m-0 text-[2.75rem] leading-[1.1] font-bold">
                Sankofa
              </h2>
              <p className="m-0 text-[1.875rem] leading-[1.4] text-pretty italic">{QUOTE}</p>
              <p className="m-0 text-[1.125rem] leading-[1.65] text-cream-dim">{MEANING}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-5 pt-8 pb-7.5">
            <div className="flex flex-wrap items-center gap-4">
              <div className={`${PLACEHOLDER} size-24 shrink-0 p-1.5 text-[0.6875rem] leading-[1.3]`}>
                <span>
                  Símbolo Sankofa
                  <br />
                  (arte da ONG)
                </span>
              </div>
              <div className="min-w-0 flex-1 basis-40">
                <p className={OVERLINE}>De onde vem o nome</p>
                <h2 id="sankofa-title" className="m-0 mt-1 [overflow-wrap:anywhere] text-[1.75rem] font-bold">
                  Sankofa
                </h2>
              </div>
            </div>
            <p className="m-0 text-[1.375rem] leading-[1.4] text-pretty italic">{QUOTE}</p>
            <p className="m-0 text-[0.96875rem] leading-[1.6] text-cream-dim">{MEANING}</p>
          </div>
        )}
      </section>
      <StripedBand />
    </>
  )
}
