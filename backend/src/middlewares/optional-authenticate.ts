import type { RequestHandler } from 'express';
import { authenticate } from './authenticate';

// No header: a visitor. A header: it has to be good, so a token that expired while a form was open answers 401
// (the client renews it and repeats the request) instead of quietly turning the person into a visitor.
export const optionalAuthenticate: RequestHandler = (req, res, next) => {
  if (req.headers.authorization) {
    authenticate(req, res, next);
    return;
  }
  next();
};
