import type { RequestHandler } from 'express';
import { ErroDaApi } from '../utils/ErroDaApi';
import { verificarToken } from '../utils/token';

/**
 * Protege a rota com JWT (RNF-SEG-01). Espera `Authorization: Bearer <token>`.
 * Token ausente, malformado, expirado ou com assinatura errada respondem o
 * mesmo 401 — o motivo exato não é informação para quem chama.
 */
export const autenticar: RequestHandler = (req, _res, next) => {
  const cabecalho = req.headers.authorization;
  const [tipo, token] = cabecalho?.split(' ') ?? [];

  if (tipo !== 'Bearer' || !token) {
    next(new ErroDaApi(401, 'nao_autenticado', 'Entre na sua conta para continuar.'));
    return;
  }

  try {
    const { sub } = verificarToken(token);
    req.usuario = { id: sub };
    next();
  } catch {
    next(new ErroDaApi(401, 'nao_autenticado', 'Entre na sua conta para continuar.'));
  }
};
