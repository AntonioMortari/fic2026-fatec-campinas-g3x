import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { ErroDaApi } from '../utils/ErroDaApi';

interface Esquemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Valida a entrada da rota antes do controller (RNF-SEG-03). O que passa é
 * substituído pela versão interpretada pelo esquema: campos que o esquema não
 * conhece são descartados, então o controller nunca vê um campo inesperado.
 */
export function validar(esquemas: Esquemas): RequestHandler {
  return (req, _res, next) => {
    const problemas: { local: string; campo: string; mensagem: string }[] = [];

    for (const local of ['body', 'query', 'params'] as const) {
      const esquema = esquemas[local];
      if (!esquema) continue;

      const resultado = esquema.safeParse(req[local]);
      if (!resultado.success) {
        for (const problema of resultado.error.issues) {
          problemas.push({ local, campo: problema.path.join('.'), mensagem: problema.message });
        }
        continue;
      }
      // No Express 5, `req.query` é um getter: redefinir a propriedade na
      // própria requisição é o jeito de entregar o valor já validado.
      Object.defineProperty(req, local, { value: resultado.data, writable: true, configurable: true });
    }

    if (problemas.length > 0) {
      next(new ErroDaApi(400, 'dados_invalidos', 'Confira os dados enviados.', problemas));
      return;
    }
    next();
  };
}
