export interface PressFeatured {
  outlet: string
  quote: string
  url?: string
  action: string
}

export interface PressItem {
  outlet: string
  year: string
  title: string
  detail: string
  url?: string
  action: string
}

// What the ONG's own material shows (the portfolio and the CV: the Folha de S.Paulo story, and the appearance on Rede Globo in 2021).
// The Wall is a segment of the Caldeirão do Huck, so it is one appearance, not two. The addresses are the ones the team gave (the Folha
// story is from 30/03/2021, as its address says); an item without `url` shows no link, and a guessed address is worse than none.
export const PRESS_FEATURED: PressFeatured = {
  outlet: 'Folha de S.Paulo',
  quote: 'Como o menino que era caixa de supermercado criou um ateliê para valorizar a cultura negra',
  url: 'https://pitacocultural.blogfolha.uol.com.br/2021/03/30/como-o-menino-que-era-caixa-de-supermercado-criou-um-atelie-para-valorizar-a-cultura-negra/',
  action: 'Ler a matéria na Folha',
}

export const PRESS_OTHERS: PressItem[] = [
  { outlet: 'Rede Globo', year: '2021', title: 'Caldeirão do Huck · quadro The Wall', detail: 'Participação em rede nacional', url: 'https://globoplay.globo.com/v/9362917/', action: 'Assistir no Globoplay' },
]
