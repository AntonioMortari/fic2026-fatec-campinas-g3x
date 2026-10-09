import type { RequestHandler } from 'express';
import { User } from '../models';
import { ApiError } from '../utils/api-error';

// Staff is read from the database on every request, never from the token or from anything the client sent.
export const requireStaff: RequestHandler = async (req, _res, next) => {
  const user = req.user ? await User.findByPk(req.user.id, { attributes: ['id', 'isStaff'] }) : null;

  if (!user) {
    next(new ApiError(401, 'unauthenticated', 'Entre na sua conta para continuar.'));
    return;
  }
  if (!user.isStaff) {
    next(new ApiError(403, 'forbidden', 'Esta área é só para a equipe.'));
    return;
  }
  next();
};
