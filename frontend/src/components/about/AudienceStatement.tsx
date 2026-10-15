export function AudienceStatement() {
  return (
    <section
      id="para-quem"
      aria-labelledby="audience-title"
      className="mx-4 mt-11 flex scroll-mt-32 flex-col gap-2 border-y-[1.5px] border-brown py-6 desktop:mx-auto desktop:mt-24 desktop:grid desktop:w-[calc(100%-4rem)] desktop:max-w-[75rem] desktop:scroll-mt-40 desktop:grid-cols-[15rem_minmax(0,1fr)] desktop:items-baseline desktop:gap-18 desktop:py-10"
    >
      <p id="audience-title" className="m-0 text-[0.6875rem] leading-[normal] font-bold uppercase tracking-[0.12em] text-ochre-deep desktop:text-overline">
        Para quem
      </p>
      <p className="m-0 text-[1.5rem] leading-[1.3] font-bold text-pretty desktop:text-[2.375rem] desktop:leading-[1.25]">
        Crianças, jovens e adultos, de todas as etnias, descendências e faixas etárias.
      </p>
    </section>
  )
}
