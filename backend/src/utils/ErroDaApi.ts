/**
 * Erro esperado, com status HTTP e código estável que o front-end pode usar
 * para escolher a mensagem. Qualquer outro erro vira 500 em `tratarErros`.
 */
export class ErroDaApi extends Error {
  constructor(
    public readonly status: number,
    public readonly codigo: string,
    mensagem: string,
    public readonly detalhes?: unknown,
  ) {
    super(mensagem);
    this.name = 'ErroDaApi';
  }
}
