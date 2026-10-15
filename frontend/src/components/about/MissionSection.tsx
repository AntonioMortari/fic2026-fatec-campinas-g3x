// The ONG's own words, from the form it sent to FATEC; only two typos were fixed ("espaço de educativo", "memoria").
const VALUES = [
  'ancestralidade',
  'respeito à diversidade',
  'valorização da cultura e da memória afro-brasileira',
  'respeito como instrumento de transformação social',
  'equidade',
  'ética',
  'coletividade',
  'afeto',
  'inclusão',
  'fortalecimento da identidade, da autoestima e do pertencimento',
]

export function MissionSection() {
  return (
    <section id="missao" aria-labelledby="mission-title" className="flex scroll-mt-32 desktop:scroll-mt-40 flex-col gap-4 px-4 pt-10 desktop:px-0">
      <p className="m-0 text-overline font-semibold uppercase tracking-[0.12em] text-ochre-deep">O que nos move</p>
      <h2 id="mission-title" className="m-0 text-[1.625rem] leading-[1.15] font-bold">
        Missão e valores
      </h2>
      <p className="m-0 text-body leading-[1.6]">
        Nossa missão é promover a valorização da cultura e da memória afro-brasileira por meio da arte, da educação e das vivências
        artísticas culturais, fortalecendo a identidade, a autoestima e o sentimento de pertencimento de crianças, jovens e adultos.
      </p>
      <p className="m-0 text-body leading-[1.6]">
        O Ateliê Afro Cultural atua como um espaço educativo de criação, reflexão e valorização da cultura e memória afro-brasileira,
        preservando saberes ancestrais, incentivando o diálogo, o respeito à diversidade e a construção de uma sociedade mais justa,
        consciente e antirracista.
      </p>
      <h3 className="m-0 mt-1 text-[1.125rem] font-bold">Nossos valores</h3>
      <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
        {VALUES.map((value) => (
          <li key={value} className="border border-line bg-card px-2.5 py-1.5 text-[0.8125rem] font-semibold">
            {value}
          </li>
        ))}
      </ul>
    </section>
  )
}
