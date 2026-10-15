import type { NewsKind } from '../models';

// Everything here comes from the material the ONG sent (the portfolio, the artists' CV, the FATEC form, the show
// sheets and the posters of each presentation). Nothing is invented: a date is here only when a poster or the
// newspaper gives it, and an image is here only when it shows adults who are part of the ONG's own team.
// Images are in backend/seed-content/images.

export interface SeedNews {
  title: string;
  kind: NewsKind;
  summary: string;
  body: string;
  publishedAt: string;
  image?: { file: string; alt: string };
}

export interface SeedPhoto {
  file: string;
  album: string;
  alt: string;
  caption: string | null;
}

// Newest first, as the public list shows them.
export const SEED_NEWS: SeedNews[] = [
  {
    title: 'Wil Oliveira apresenta Cafú e o Café no CCSP, no Mês da Consciência Negra',
    kind: 'news',
    summary:
      'No sábado, 2 de novembro de 2024, das 15h às 16h, a programação gratuita do Mês da Consciência Negra do CCSP incluía a performance, na Biblioteca Infantil.',
    body: [
      'No sábado, 2 de novembro de 2024, das 15h às 16h, a programação do Mês da Consciência Negra do CCSP incluía, na Biblioteca Infantil, a performance Cafú e o Café, com Wil Oliveira, dentro da série “Para escurecer as ideias”. A entrada era gratuita e a classificação, livre.',
      'Cafú e o Café é uma contação de histórias escrita e ilustrada por Wil. Em linguagem acessível e simples, ela retrata memórias da cultura afro-brasileira, em especial a contribuição que a cultura africana forneceu ao Brasil.',
      'As narrativas levam o público às fazendas de café do Vale do Paraíba do século XIX, e a história central gira em torno de situações de preconceito racial, através de bullying no ambiente escolar.',
    ].join('\n\n'),
    publishedAt: '2024-11-02T12:00:00-03:00',
    image: {
      file: 'cafu-e-o-cafe-livro.jpg',
      alt: 'Wil Oliveira sorri, deitado sobre uma esteira de palha, cercado de exemplares do livro infantil Cafú e o Café.',
    },
  },
  {
    title: 'Contação de histórias do Ateliê na IX FELIZS, a Feira Literária da Zona Sul',
    kind: 'news',
    summary:
      'Em 22 de setembro de 2023, o Ateliê Afro Cultural estava na programação da IX FELIZS, na Biblioteca Comunitária Djeanne Firmino.',
    body: [
      'A IX FELIZS, a Feira Literária da Zona Sul, aconteceu de 18 a 23 de setembro de 2023.',
      'Na programação, o Ateliê Afro Cultural, com Wil e Nathy, tinha uma contação de histórias na sexta-feira, 22 de setembro, às 10h, na Biblioteca Comunitária Djeanne Firmino.',
    ].join('\n\n'),
    publishedAt: '2023-09-22T12:00:00-03:00',
  },
  {
    title: 'Leilão Solidário: seu lance causa impacto',
    kind: 'campaign',
    summary:
      'No Dia da Consciência Negra de 2021, o Leilão Solidário PB Arts Design, apresentado pela Five Three Auctions, trouxe uma peça única e exclusiva com a marca do Ateliê Afro Cultural.',
    body: [
      'O Leilão Solidário PB Arts Design, apresentado pela Five Three Auctions, foi marcado para 20 de novembro de 2021, Dia da Consciência Negra.',
      'A peça do leilão é única e exclusiva e leva a marca do Ateliê Afro Cultural. O convite resumia a proposta: “Seu lance causa impacto”.',
    ].join('\n\n'),
    publishedAt: '2021-11-20T12:00:00-03:00',
  },
  {
    title: 'Wil e Nathy no quadro The Wall, do Caldeirão do Huck',
    kind: 'news',
    summary:
      'Em 19 de março de 2021, véspera do Dia Internacional contra a Discriminação Racial, o casal que idealizou o Ateliê Afro Cultural participou do programa da Rede Globo.',
    body: [
      'No dia 19 de março de 2021, véspera do Dia Internacional contra a Discriminação Racial, Wil Oliveira e Nathy Monteiro, que idealizaram o Ateliê Afro Cultural, participaram do quadro The Wall, do Caldeirão do Huck, na Rede Globo.',
      'No programa, Wil fez um discurso contra o racismo. O ateliê, que nasceu em 2020 na Casa Verde, zona norte de São Paulo, ganhou visibilidade depois dessa participação.',
      'A história do projeto também foi contada pela Folha de S.Paulo, na reportagem “Como o menino que era caixa de supermercado criou um ateliê para valorizar a cultura negra”, de Priscila Camarano.',
    ].join('\n\n'),
    publishedAt: '2021-03-19T12:00:00-03:00',
  },
];

const BRASIL_NEGREIRO = 'Brasil Negreiro: Imaginário em Liberdade';
const BRASIL_NEGREIRO_CAPTION = 'Brasil Negreiro: Imaginário em Liberdade, no Teatro Municipal Adélia Lorenzetti.';

// In the order they go on air: the last album of the list is the newest, so it is the first one the page shows.
export const SEED_PHOTOS: SeedPhoto[] = [
  {
    file: 'brasil-negreiro-correntes.jpg',
    album: BRASIL_NEGREIRO,
    alt: 'Wil Oliveira, em cena, com correntes sobre o corpo e a cabeça erguida, diante de uma cortina escura.',
    caption: BRASIL_NEGREIRO_CAPTION,
  },
  {
    file: 'brasil-negreiro-arco.jpg',
    album: BRASIL_NEGREIRO,
    alt: 'Wil Oliveira, em cena, canta ao microfone enquanto toca um berimbau, vestido com uma saia de palha.',
    caption: BRASIL_NEGREIRO_CAPTION,
  },
  {
    file: 'brasil-negreiro-peneira.jpg',
    album: BRASIL_NEGREIRO,
    alt: 'Wil Oliveira, em cena, canta ao microfone segurando uma peneira de palha trançada.',
    caption: BRASIL_NEGREIRO_CAPTION,
  },
  {
    file: 'cafu-e-o-cafe-livro.jpg',
    album: 'Cafú e o Café',
    alt: 'Wil Oliveira sorri, deitado sobre uma esteira de palha, cercado de exemplares do livro infantil Cafú e o Café.',
    caption: 'Wil Oliveira com o livro que escreveu e ilustrou.',
  },
  {
    file: 'wil-atabaque-estandarte.jpg',
    album: 'Ateliê Afro Cultural',
    alt: 'Wil Oliveira, de camisa amarela do ateliê, ri enquanto toca um tambor ao lado do estandarte bordado com o nome Ateliê Afro Cultural.',
    caption: null,
  },
  {
    file: 'wil-djembe-painel-grafitado.jpg',
    album: 'Ateliê Afro Cultural',
    alt: 'Wil Oliveira, de chapéu de palha, sorri segurando um tambor diante de um painel grafitado e do estandarte do ateliê.',
    caption: null,
  },
];
