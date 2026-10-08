/** Primeiro foco da página: pula cabeçalho e navegação direto para o conteúdo. */
export function LinkDePular() {
  return (
    <a
      href="#conteudo"
      className="sr-only z-50 bg-marrom px-4 py-3 font-semibold text-creme focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
    >
      Pular para o conteúdo
    </a>
  )
}
