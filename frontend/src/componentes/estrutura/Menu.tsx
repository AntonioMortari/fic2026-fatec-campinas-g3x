import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { classes } from '../../compartilhado/classes'
import { CONTATOS } from '../../compartilhado/contatos'
import { GRUPOS_DO_MENU } from '../../compartilhado/navegacao'
import { PASSO_MAXIMO, PASSO_MINIMO } from '../../contextos/contextoDeLeitura'
import { usePreferenciasDeLeitura } from '../../contextos/usePreferenciasDeLeitura'

/**
 * Menu em folha (Análise UX/UI, 3a): sobe de baixo, ao alcance do polegar,
 * com os destinos em três grupos, os canais de contato e os controles de
 * leitura — é aqui que moram o WhatsApp e a acessibilidade, no lugar do
 * botão flutuante e da barra fixa do site antigo.
 *
 * É um <dialog> nativo aberto com showModal(): o navegador prende o foco,
 * fecha com Esc, deixa o resto da página inerte e, ao fechar, devolve o
 * foco ao botão que abriu.
 */
export type SecaoDoMenu = 'inicio' | 'leitura'
export type AbrirMenu = (secao: SecaoDoMenu) => void

const TONS = { ocre: 'text-ocre-escuro', azul: 'text-azul-escuro', marrom: 'text-marrom-400' }
const SOBRETITULO = 'm-0 text-sobretitulo font-semibold uppercase tracking-[0.12em]'
const BOTAO_LEITURA =
  'grid min-h-11 cursor-pointer place-items-center rounded-controle border-[1.5px] border-marrom px-2 text-secundario font-semibold'

interface Props {
  aberto: boolean
  secao: SecaoDoMenu
  aoFechar: () => void
}

export function Menu({ aberto, secao, aoFechar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const leitura = useRef<HTMLHeadingElement>(null)
  const preferencias = usePreferenciasDeLeitura()

  useEffect(() => {
    const elemento = dialogo.current
    if (!elemento) return
    if (aberto && !elemento.open) {
      elemento.showModal()
      if (secao === 'leitura') {
        leitura.current?.scrollIntoView({ block: 'start' })
        leitura.current?.focus()
      }
    } else if (!aberto && elemento.open) {
      elemento.close()
    }
  }, [aberto, secao])

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="menu-titulo"
      onClose={aoFechar}
      onClick={(evento) => {
        // Toque no véu (fora do painel) fecha.
        if (evento.target === evento.currentTarget) aoFechar()
      }}
      className={classes(
        'm-0 mt-auto h-[calc(100dvh-4rem)] max-h-none w-full max-w-none border-0 border-t-[1.5px] border-marrom bg-cartao p-0 text-marrom',
        'backdrop:bg-veu open:animate-folha',
        'desktop:mx-auto desktop:max-w-xl desktop:border-x-[1.5px]',
      )}
    >
      <div className="flex h-full flex-col">
        <div aria-hidden="true" className="flex justify-center pt-2.5 pb-1">
          <span className="h-1 w-11 rounded-sm bg-creme-apagado" />
        </div>
        <div className="flex items-center justify-between px-4 pt-1 pb-2">
          <h2 id="menu-titulo" className="m-0 text-h2 font-bold">
            Menu
          </h2>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar o menu"
            className="grid size-11 cursor-pointer place-items-center rounded-controle border-[1.5px] border-marrom bg-transparent text-xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-24 desktop:pb-8">
          <nav aria-label="Todas as páginas">
            {GRUPOS_DO_MENU.map((grupo, indice) => (
              <section key={grupo.titulo} aria-labelledby={`menu-grupo-${indice}`}>
                <h3 id={`menu-grupo-${indice}`} className={classes(SOBRETITULO, indice === 0 ? 'mt-3.5' : 'mt-5', 'mb-0.5', TONS[grupo.tom])}>
                  {grupo.titulo}
                </h3>
                <ul className="m-0 list-none p-0">
                  {grupo.itens.map((item) => (
                    <li key={item.para} className="border-b border-linha">
                      <Link
                        to={item.para}
                        onClick={aoFechar}
                        className="flex min-h-13 items-center text-item font-semibold text-marrom no-underline hover:text-marrom"
                      >
                        {item.rotulo}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </nav>

          <h3 className={classes(SOBRETITULO, 'mt-6 mb-2.5 text-marrom-400')}>Fale com a gente</h3>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={CONTATOS.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-12 items-center justify-center bg-marrom text-[0.9375rem] font-semibold text-creme no-underline hover:text-creme"
            >
              WhatsApp
            </a>
            <Link
              to="/contato"
              onClick={aoFechar}
              className="flex min-h-12 items-center justify-center border-[1.5px] border-marrom text-[0.9375rem] font-semibold text-marrom no-underline hover:text-marrom"
            >
              Contato
            </Link>
          </div>

          <h3 ref={leitura} tabIndex={-1} className={classes(SOBRETITULO, 'mt-6 mb-2.5 scroll-mt-4 text-marrom-400')}>
            Leitura
          </h3>
          <div role="group" aria-label="Tamanho do texto e contraste" className="grid grid-cols-[repeat(3,1fr)_1.6fr] gap-2">
            <button
              type="button"
              aria-label="A−, diminuir o texto"
              disabled={preferencias.passoDaFonte <= PASSO_MINIMO}
              onClick={preferencias.diminuirFonte}
              className={classes(BOTAO_LEITURA, 'bg-transparent disabled:opacity-50')}
            >
              A−
            </button>
            <button
              type="button"
              aria-label="A, texto no tamanho normal"
              aria-pressed={preferencias.passoDaFonte === 0}
              onClick={preferencias.fonteNormal}
              className={classes(BOTAO_LEITURA, preferencias.passoDaFonte === 0 ? 'bg-marrom text-creme' : 'bg-transparent')}
            >
              A
            </button>
            <button
              type="button"
              aria-label="A+, aumentar o texto"
              disabled={preferencias.passoDaFonte >= PASSO_MAXIMO}
              onClick={preferencias.aumentarFonte}
              className={classes(BOTAO_LEITURA, 'bg-transparent disabled:opacity-50')}
            >
              A+
            </button>
            <button
              type="button"
              aria-pressed={preferencias.altoContraste}
              onClick={preferencias.alternarContraste}
              className={classes(BOTAO_LEITURA, preferencias.altoContraste ? 'bg-marrom text-creme' : 'bg-transparent')}
            >
              {preferencias.altoContraste && <span aria-hidden="true">✓ </span>}Alto contraste
            </button>
          </div>
        </div>
      </div>
    </dialog>
  )
}
