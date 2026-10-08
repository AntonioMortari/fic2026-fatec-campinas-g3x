import { Link } from 'react-router-dom'
import { Card } from '../ui'

const SECTORS = [
  {
    title: 'Literário',
    text: 'Livros de temática negra, leituras, contação de histórias e teatro.',
    image: '/images/sector-literary.jpg',
    alt: 'Wil Oliveira cercado de exemplares do livro infantil Cafú e o Café, de sua autoria.',
  },
  {
    title: 'Musical',
    text: 'Jongo, maculelê, maracatu, samba, rap, hip hop e funk.',
    image: '/images/sector-musical.jpg',
    alt: 'Wil Oliveira em cena no espetáculo Brasil Negreiro, tocando um instrumento de percussão.',
  },
  {
    title: 'Artístico criativo',
    text: 'Pintura, figurinos reciclados, desenho, escultura e colagem.',
    image: '/images/sector-artistic.jpg',
    alt: 'Wil Oliveira de chapéu de palha com um tambor, diante de um painel grafitado e do estandarte do ateliê.',
  },
]

export function WhatWeDo() {
  return (
    <section aria-labelledby="what-we-do-title" className="mx-auto max-w-page desktop:px-8">
      <div className="mb-3.5 flex items-baseline justify-between gap-4 px-4 desktop:mb-5 desktop:px-0">
        <h2 id="what-we-do-title" className="m-0 text-h2 font-bold desktop:text-h2-desktop">
          O que fazemos
        </h2>
        <Link to="/quem-somos" className="hidden min-h-11 items-center text-[0.9375rem] font-semibold desktop:inline-flex">
          Ler nossa história completa →
        </Link>
      </div>
      <ul
        tabIndex={0}
        aria-label="Setores do ateliê"
        className="m-0 flex list-none snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] desktop:grid desktop:grid-cols-3 desktop:gap-6 desktop:overflow-visible desktop:px-0"
      >
        {SECTORS.map((sector) => (
          <Card as="li" key={sector.title} className="w-[78%] flex-none snap-start desktop:w-auto">
            <img src={sector.image} alt={sector.alt} width={1000} height={500} loading="lazy" className="block aspect-[3/2] w-full object-cover" />
            <div className="px-4 pt-3.5 pb-4 desktop:px-5 desktop:pt-4.5 desktop:pb-5.5">
              <h3 className="m-0 mb-1 text-h3 font-bold desktop:mb-1.5 desktop:text-[1.3125rem]">{sector.title}</h3>
              <p className="m-0 text-[0.9375rem] text-brown-600 desktop:text-body">{sector.text}</p>
            </div>
          </Card>
        ))}
      </ul>
      <Link to="/quem-somos" className="mx-4 mt-3 inline-flex min-h-11 items-center font-semibold desktop:hidden">
        Ler nossa história completa →
      </Link>
    </section>
  )
}
