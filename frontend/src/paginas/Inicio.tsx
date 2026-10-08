import { Botao, CabecalhoDaPagina } from '../componentes/ui'

/**
 * Página inicial provisória: só o cabeçalho da página no modelo novo, com o
 * texto real da ONG. A home desenhada (Análise UX/UI, 2a/6a) é a tarefa 4.1
 * do Plano de Migração e entra num PR próprio.
 */
export function Inicio() {
  return (
    <CabecalhoDaPagina
      sobretitulo="Casa Verde · São Paulo"
      titulo={
        <>
          Arte, memória e <em className="text-ocre-escuro not-italic">pertencimento</em> — feitos à mão, todo dia
        </>
      }
      lead="Espaço educativo de criação, reflexão e valorização da cultura e memória afro brasileira."
      acao={<Botao para="/projetos">Conhecer nossos projetos</Botao>}
    />
  )
}
