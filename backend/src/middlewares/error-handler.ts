import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ApiError } from '../utils/api-error';

export const notFound: RequestHandler = (req, _res, next) => {
  next(new ApiError(404, 'not_found', `Rota ${req.method} ${req.path} não existe.`));
};

function isJsonParseError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.parse.failed';
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message, details: error.details } });
    return;
  }

  if (isJsonParseError(error)) {
    res.status(400).json({ error: { code: 'invalid_json', message: 'O corpo da requisição não é um JSON válido.' } });
    return;
  }

  console.error('[error]', error);
  res.status(500).json({ error: { code: 'internal_error', message: 'Algo deu errado do nosso lado. Tente de novo.' } });
};
