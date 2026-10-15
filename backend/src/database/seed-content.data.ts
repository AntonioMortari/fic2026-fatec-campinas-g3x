import type { NewsKind } from '../models';

// Everything here comes from the material the ONG sent (the portfolio, the artists' CV, the FATEC form, the show
// sheets and the posters of each presentation). Nothing is invented: a date is here only when a poster or the
// newspaper gives it, and an image is here only when it shows adults who are part of the ONG's own team.
// Images are in backend/seed-content/images: loose photos the ONG sent, plus pictures cut from its own PDFs (portfolio, show sheets,
// CV). Left out on purpose: anyone who is not an adult of the ONG's own team (children, audiences), stills from TV, the newspaper
// clipping, posters with partners' marks, and the AI-made pictures of the "Batuque na Cozinha" sheet, which are not records of anything.

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
const BANZO = 'Banzo';
const BANZO_CAPTION = 'Banzo, contação de história performática.';
const CABACA = 'A Cabaça e o Canto Ancestral';
const CATIRINA = 'Catirina e Nego Dito';
const MATA = 'Brincadeiras Encantadas na Mata';
const GRIOT = 'Eu Griot';
const CAFU = 'Cafú e o Café';
const ATELIE = 'Ateliê Afro Cultural';

// In the order they go on air: the last album of the list is the newest, so it is the first one the page shows.
export const SEED_PHOTOS: SeedPhoto[] = [
  {
    file: 'cafu-e-o-cafe-livro.jpg',
    album: CAFU,
    alt: 'Wil Oliveira sorri, deitado sobre uma esteira de palha, cercado de exemplares do livro infantil Cafú e o Café.',
    caption: 'Wil Oliveira com o livro que escreveu e ilustrou.',
  },
  {
    file: 'cafu-e-o-cafe-capa.jpg',
    album: CAFU,
    alt: 'Capa do livro Cafú e o Café, de Wil Oliveira: o rosto de um personagem de cabelo cinza, cercado de folhas e frutos do café.',
    caption: 'A capa, com texto e ilustrações de Wil Oliveira.',
  },
  {
    file: 'eu-griot-wil-com-os-bonecos.jpg',
    album: GRIOT,
    alt: 'Wil Oliveira, de chapéu de palha e roupa azul com uma faixa laranja, conta uma história com um tambor de mão, e bonecos de tecido xadrez aparecem ao fundo.',
    caption: 'Oficina Eu Griot.',
  },
  {
    file: 'mata-cenario-chita-e-cabacas.jpg',
    album: MATA,
    alt: 'Cenário colorido feito de tecidos de chita, cabaças e elementos naturais, com um tapete verde no chão.',
    caption: 'O cenário é feito de chitas e elementos naturais, como cabaças, palha sisal, pinhas e troncos.',
  },
  {
    file: 'mata-cesto-com-pinha.jpg',
    album: MATA,
    alt: 'Um cesto de palha com uma pinha e folhas, apoiado sobre tecidos de chita estampados.',
    caption: null,
  },
  {
    file: 'mata-cabacas-e-pinhas.jpg',
    album: MATA,
    alt: 'Cabaças, pinhas e um tronco de árvore entre aros cobertos de chita, parte do cenário da vivência.',
    caption: null,
  },
  {
    file: 'catirina-e-nego-dito-ilustracao.jpg',
    album: CATIRINA,
    alt: 'Ilustração com o nome Catirina e Nego Dito e os dois personagens sobre um fundo verde.',
    caption: null,
  },
  {
    file: 'catirina-e-nego-dito-bonecos.jpg',
    album: CATIRINA,
    alt: 'Os bonecos Catirina e Nego Dito lado a lado, de pano escuro, sobre tecido de chita florido.',
    caption: 'Apresentação com fantoches e música ao vivo.',
  },
  {
    file: 'catirina-boneca.jpg',
    album: CATIRINA,
    alt: 'A boneca Catirina, de pano escuro, com cabelo de cachos, blusa vermelha e saia xadrez, sobre tecido de chita.',
    caption: null,
  },
  {
    file: 'nego-dito-boneco.jpg',
    album: CATIRINA,
    alt: 'O boneco Nego Dito, de pano escuro, com camisa amarela e calça xadrez, sobre tecido de chita.',
    caption: null,
  },
  {
    file: 'catirina-cabeca-do-boi.jpg',
    album: CATIRINA,
    alt: 'A cabeça do boi, de cor escura, com uma estrela branca, fitas coloridas e enfeites dourados.',
    caption: null,
  },
  {
    file: 'cabaca-mascara-de-buzios.jpg',
    album: CABACA,
    alt: 'Máscara afro feita de cabaça e búzios: fileiras de búzios contornam os olhos, uma semente faz o nariz e um búzio grande forma a boca.',
    caption: 'A máscara usada em cena, feita de cabaça e búzios.',
  },
  {
    file: 'cabaca-medalhao-e-buzios.jpg',
    album: CABACA,
    alt: 'Cabaça com um medalhão de metal ao centro e colares de búzios, sobre uma esteira de palha.',
    caption: null,
  },
  {
    file: 'cabaca-cabacas-em-roda.jpg',
    album: CABACA,
    alt: 'Cabaças de vários formatos dispostas em roda sobre uma esteira, com a cabaça do medalhão e dos búzios ao centro.',
    caption: null,
  },
  {
    file: 'cabaca-instrumentos.jpg',
    album: CABACA,
    alt: 'Instrumentos musicais feitos de cabaça, entre eles uma kalimba e chocalhos, espalhados sobre uma esteira.',
    caption: 'O canto ancestral são os instrumentos musicais feitos com a cabaça.',
  },
  {
    file: 'cabaca-wil-com-porongo.jpg',
    album: CABACA,
    alt: 'Wil Oliveira, de chapéu de palha, sorri ao lado de um boneco de cabaça com olhos de búzio.',
    caption: null,
  },
  {
    file: 'banzo-wil-maos-abertas.jpg',
    album: BANZO,
    alt: 'Wil Oliveira, de regata vermelha e colares, sorri com as mãos abertas diante do rosto, com pintura branca ao redor dos olhos.',
    caption: BANZO_CAPTION,
  },
  {
    file: 'banzo-wil-em-cena.jpg',
    album: BANZO,
    alt: 'Wil Oliveira, em cena, de chapéu de palha e roupa de estampa africana, com um braço estendido diante de uma cortina azul.',
    caption: null,
  },
  {
    file: 'banzo-wil-de-turbante.jpg',
    album: BANZO,
    alt: 'Wil Oliveira, em cena, com um gorro de palha e uma capa estampada, canta de perfil usando um microfone de cabeça.',
    caption: null,
  },
  {
    file: 'banzo-wil-de-chapeu-de-palha.jpg',
    album: BANZO,
    alt: 'Wil Oliveira, em cena, de chapéu de palha desfiado e capa de estampa vermelha, segura um tambor de mão.',
    caption: null,
  },
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
    file: 'brasil-negreiro-correntes-rosto.jpg',
    album: BRASIL_NEGREIRO,
    alt: 'Wil Oliveira, em cena, de cabeça baixa e com correntes sobre o peito e os ombros, diante de um muro grafitado em tons de azul.',
    caption: null,
  },
  {
    file: 'brasil-negreiro-correntes-preto-e-branco.jpg',
    album: BRASIL_NEGREIRO,
    alt: 'Em preto e branco, Wil Oliveira encara a câmera, com correntes sobre os ombros e as mãos erguidas segurando os elos.',
    caption: null,
  },
  {
    file: 'brasil-negreiro-correntes-curvado.jpg',
    album: BRASIL_NEGREIRO,
    alt: 'Wil Oliveira, em cena, de cabeça baixa e corpo curvado, com correntes presas ao corpo.',
    caption: null,
  },
  {
    file: 'brasil-negreiro-colar-de-dentes.jpg',
    album: BRASIL_NEGREIRO,
    alt: 'Wil Oliveira, em cena, com gorro e manta de estampa de onça, colar de dentes e saia de palha, segura um instrumento trançado.',
    caption: null,
  },
  {
    file: 'livros-da-tematica-negra.jpg',
    album: ATELIE,
    alt: 'Livros da temática negra, de capas variadas, espalhados pelo chão.',
    caption: 'Livros da temática negra do setor literário.',
  },
  {
    file: 'brincantes-bonecos-e-livros-na-esteira.jpg',
    album: ATELIE,
    alt: 'Bonecos de pano, tecidos em formato do continente africano e livros infantis expostos sobre uma esteira de palha.',
    caption: null,
  },
  {
    file: 'kombi-atelie-itinerante.jpg',
    album: ATELIE,
    alt: 'Ilustração colorida de uma Kombi com a placa Ateliê Afro Cultural, numa rua de casas coloridas à noite.',
    caption: 'Ateliê Afro Cultural Itinerante.',
  },
  {
    file: 'wil-fazendo-boneco-de-cabaca.jpg',
    album: ATELIE,
    alt: 'Wil Oliveira, sentado em seu ateliê, trabalha num boneco de cabaça, rodeado de prateleiras com materiais.',
    caption: null,
  },
  {
    file: 'wil-sentado-com-tambor.jpg',
    album: ATELIE,
    alt: 'Wil Oliveira, de camisa estampada azul, sentado numa banqueta diante de um muro de tijolos, com um tambor entre as pernas e um berimbau ao fundo.',
    caption: null,
  },
  {
    file: 'wil-atabaque-estandarte.jpg',
    album: ATELIE,
    alt: 'Wil Oliveira, de camisa amarela do ateliê, ri enquanto toca um tambor ao lado do estandarte bordado com o nome Ateliê Afro Cultural.',
    caption: null,
  },
  {
    file: 'wil-djembe-painel-grafitado.jpg',
    album: ATELIE,
    alt: 'Wil Oliveira, de chapéu de palha, sorri segurando um tambor diante de um painel grafitado e do estandarte do ateliê.',
    caption: null,
  },
];
