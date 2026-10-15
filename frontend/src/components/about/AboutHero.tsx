export function AboutHero() {
  return (
    <section className="desktop:mx-auto desktop:grid desktop:max-w-page desktop:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] desktop:items-center desktop:gap-12 desktop:px-8 desktop:pt-12">
      <img src="/images/hero-portrait.jpg" alt="" width={800} height={1000} className="block aspect-[4/5] w-full object-cover" />
      <div className="relative mx-4 -mt-24 border-[1.5px] border-brown bg-card px-5 py-5.5 shadow-applique-hero desktop:mx-0 desktop:mt-0">
        <p className="m-0 mb-2.5 text-overline font-semibold uppercase tracking-[0.12em] text-ochre-deep">Quem somos</p>
        <h1 className="m-0 [overflow-wrap:anywhere] text-[1.875rem] leading-[1.12] font-bold text-pretty">
          Um espaço educativo de <em className="text-ochre-deep not-italic">reflexão, criação</em> e valorização da cultura e
          memória afro-brasileira
        </h1>
        <p className="m-0 mt-3 text-[0.9375rem] leading-normal text-brown-400">Casa Verde, zona norte de São Paulo · desde 2020</p>
      </div>
    </section>
  )
}
