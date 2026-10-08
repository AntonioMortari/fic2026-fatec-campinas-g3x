/**
 * Mapa de navegação do site público — uma fonte só para a barra inferior
 * (celular), o cabeçalho (desktop) e o menu em folha.
 *
 * Desenho: "Análise UX/UI", telas 2a (barra), 3a (menu) e 6a (cabeçalho
 * desktop). DECISÃO EM ABERTO no Plano de Migração (F2.2): a Biblioteca
 * entra na barra no lugar de Projetos? Enquanto o grupo não decide, vale a
 * tela 2a: Início · Agenda · Projetos · Apoiar · Menu. Trocar é editar
 * BARRA_INFERIOR e NAVEGACAO_DESKTOP abaixo.
 */

export interface Destino {
  rotulo: string
  para: string
}

export interface GrupoDoMenu {
  titulo: string
  /** Cor do sobretítulo do grupo, como na tela 3a. */
  tom: 'ocre' | 'azul' | 'marrom'
  itens: Destino[]
}

export const INICIO: Destino = { rotulo: 'Início', para: '/' }
export const APOIAR: Destino = { rotulo: 'Apoiar', para: '/doar' }

/** Os destinos da barra inferior, sem o "Apoiar" (destacado) e o "Menu" (botão). */
export const BARRA_INFERIOR: Destino[] = [
  INICIO,
  { rotulo: 'Agenda', para: '/agenda' },
  { rotulo: 'Projetos', para: '/projetos' },
]

/** Links do cabeçalho no desktop; o resto fica em "Mais". */
export const NAVEGACAO_DESKTOP: Destino[] = [
  INICIO,
  { rotulo: 'Agenda', para: '/agenda' },
  { rotulo: 'Projetos', para: '/projetos' },
  { rotulo: 'Quem somos', para: '/quem-somos' },
]

/** Menu em folha (tela 3a): três grupos, na ordem do desenho. */
export const GRUPOS_DO_MENU: GrupoDoMenu[] = [
  {
    titulo: 'Conhecer',
    tom: 'ocre',
    itens: [
      { rotulo: 'Quem somos', para: '/quem-somos' },
      { rotulo: 'Projetos', para: '/projetos' },
      { rotulo: 'Galeria', para: '/galeria' },
    ],
  },
  {
    titulo: 'Participar',
    tom: 'azul',
    itens: [
      { rotulo: 'Agenda', para: '/agenda' },
      { rotulo: 'Voluntariado', para: '/voluntariado' },
      { rotulo: 'Para escolas', para: '/para-escolas' },
    ],
  },
  {
    titulo: 'Ler',
    tom: 'marrom',
    itens: [
      { rotulo: 'Notícias', para: '/noticias' },
      { rotulo: 'Acervo', para: '/acervo' },
    ],
  },
]

/** A rota está ativa? Início só casa exatamente; as demais por prefixo. */
export function rotaAtiva(destino: string, atual: string): boolean {
  if (destino === '/') return atual === '/'
  return atual === destino || atual.startsWith(`${destino}/`)
}
