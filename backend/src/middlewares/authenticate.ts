import type { RequestHandler } from 'express';
import { ApiError } from '../utils/api-error';
import { verifyToken } from '../utils/token';

const unauthenticated = () => new ApiError(401, 'unauthenticated', 'Entre na sua conta para continuar.');

export const authenticate: RequestHandler = (req, _res, next) => {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    next(unauthenticated());
    return;
  }

  try {
    req.user = { id: verifyToken(token).sub };
    next();
  } catch {
    next(unauthenticated());
  }
};
