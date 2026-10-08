import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ErroDaApi } from '../utils/ErroDaApi';

/** Rota que não existe na API: 404 no mesmo formato de erro do resto. */
export const rotaNaoEncontrada: RequestHandler = (req, _res, next) => {
  next(new ErroDaApi(404, 'nao_encontrado', `Rota ${req.method} ${req.path} não existe.`));
};

/**
 * Ponto único de resposta de erro (RNF-BE-03). No Express 5 uma Promise
 * rejeitada num handler `async` chega aqui sozinha, sem try/catch na rota.
 *
 * Formato: `{ erro: { codigo, mensagem, detalhes? } }`. Erro inesperado nunca
 * devolve a mensagem nem a pilha — elas vão para o log do servidor.
 */
export const tratarErros: ErrorRequestHandler = (erro, _req, res, _next) => {
  if (erro instanceof ErroDaApi) {
    res.status(erro.status).json({
      erro: { codigo: erro.codigo, mensagem: erro.message, detalhes: erro.detalhes },
    });
    return;
  }

  // JSON malformado no corpo: o express.json() lança com `type` e `status`.
  if (typeof erro === 'object' && erro !== null && 'type' in erro && erro.type === 'entity.parse.failed') {
    res.status(400).json({ erro: { codigo: 'json_invalido', mensagem: 'O corpo da requisição não é um JSON válido.' } });
    return;
  }

  console.error('[erro]', erro);
  res.status(500).json({ erro: { codigo: 'erro_interno', mensagem: 'Algo deu errado do nosso lado. Tente de novo.' } });
};
