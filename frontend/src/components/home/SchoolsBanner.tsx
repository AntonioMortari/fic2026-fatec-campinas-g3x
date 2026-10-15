import { Button } from '../ui'

export function SchoolsBanner() {
  return (
    <section aria-labelledby="schools-title" className="mt-11 bg-brown text-cream desktop:mt-22">
      <div className="mx-auto flex max-w-page flex-col gap-3 px-4 py-7 desktop:flex-row desktop:items-center desktop:justify-between desktop:gap-10 desktop:px-8 desktop:py-11">
        <div className="flex flex-col gap-3 desktop:max-w-160 desktop:gap-2.5">
          <h2 id="schools-title" className="m-0 text-[1.5rem] leading-[1.15] font-bold desktop:text-[1.75rem] desktop:leading-[normal]">
            É de uma escola ou instituição?
          </h2>
          <p className="m-0 text-[0.9375rem] leading-[1.55] text-cream-dim desktop:text-[1.03125rem]">
            Levamos contações de história e vivências brincantes até o seu espaço. Todas as atividades se adaptam a qualquer local e têm classificação livre.
          </p>
        </div>
        <Button to="/para-escolas" variant="support" className="min-h-12.5 text-[0.9375rem] desktop:min-h-13 desktop:flex-none desktop:px-6">
          Ver como funciona
        </Button>
      </div>
    </section>
  )
}
