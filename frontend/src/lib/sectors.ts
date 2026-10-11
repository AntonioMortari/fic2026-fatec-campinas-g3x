export type SectorKey = 'literary' | 'musical' | 'artistic'

export interface Sector {
  key: SectorKey
  title: string
  image: string
  alt: string
}

export const SECTORS: Sector[] = [
  {
    key: 'literary',
    title: 'Literário',
    image: '/images/sector-literary.jpg',
    alt: 'Wil Oliveira cercado de exemplares do livro infantil Cafú e o Café, de sua autoria.',
  },
  {
    key: 'musical',
    title: 'Musical',
    image: '/images/sector-musical.jpg',
    alt: 'Wil Oliveira em cena no espetáculo Brasil Negreiro, tocando um instrumento de percussão.',
  },
  {
    key: 'artistic',
    title: 'Artístico criativo',
    image: '/images/sector-artistic.jpg',
    alt: 'Wil Oliveira de chapéu de palha com um tambor, diante de um painel grafitado e do estandarte do ateliê.',
  },
]
