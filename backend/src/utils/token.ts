import jwt, { type SignOptions } from 'jsonwebtoken';
import { ambiente } from '../config/env';

/** O que vai dentro do JWT: só o identificador. Papéis são lidos do banco. */
export interface ConteudoDoToken {
  sub: string;
}

const ALGORITMO = 'HS256';

export function assinarToken(conteudo: ConteudoDoToken): string {
  return jwt.sign(conteudo, ambiente.JWT_SEGREDO, {
    algorithm: ALGORITMO,
    expiresIn: ambiente.JWT_EXPIRA_EM as SignOptions['expiresIn'],
  });
}

/** Lança se o token for inválido, expirado ou assinado com outro algoritmo. */
export function verificarToken(token: string): ConteudoDoToken {
  const conteudo = jwt.verify(token, ambiente.JWT_SEGREDO, { algorithms: [ALGORITMO] });
  if (typeof conteudo === 'string' || typeof conteudo.sub !== 'string') {
    throw new Error('token sem identificador');
  }
  return { sub: conteudo.sub };
}
