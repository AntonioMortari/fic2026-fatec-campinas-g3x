import type { RequestHandler } from 'express';
import { ApiError } from '../utils/api-error';

// A cross-site page cannot add this header without a CORS preflight, which only the allowed origins pass.
// It backs up SameSite for the two routes that act on the cookie alone.
export const requireXhr: RequestHandler = (req, _res, next) => {
  if (!req.headers['x-requested-with']) {
    next(new ApiError(403, 'forbidden_request', 'Requisição não permitida.'));
    return;
  }
  next();
};
