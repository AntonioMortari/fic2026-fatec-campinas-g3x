import { Button } from '../ui'

export function SchoolsBanner() {
  return (
    <section aria-labelledby="schools-title" className="bg-brown text-cream">
      <div className="mx-auto flex max-w-page flex-col gap-4.5 px-5 py-7 desktop:grid desktop:grid-cols-[1fr_auto] desktop:items-center desktop:gap-12 desktop:px-8 desktop:py-12">
        <div>
          <h2 id="schools-title" className="m-0 mb-2 text-h2 font-bold desktop:mb-2.5 desktop:text-[2rem] desktop:leading-[1.15]">
            É de uma escola ou instituição?
          </h2>
          <p className="m-0 max-w-160 text-[0.9375rem] text-cream-dim desktop:text-[1.125rem]">
            Levamos contações de história e vivências brincantes até o seu espaço. Todas se adaptam a qualquer local e têm classificação livre.
          </p>
        </div>
        <Button to="/para-escolas" variant="support" className="font-semibold desktop:min-h-14 desktop:px-7">
          Ver como funciona
        </Button>
      </div>
    </section>
  )
}
