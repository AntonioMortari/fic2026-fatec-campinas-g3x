import { Router } from 'express';
import { login, logout, me, refresh, register } from '../controllers/auth.controller';
import { loginBody, registerBody } from '../validators/auth.validator';
import { authenticate } from '../middlewares/authenticate';
import { requireXhr } from '../middlewares/require-xhr';
import { validate } from '../middlewares/validate';

export const authRoutes = Router();

authRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

authRoutes.post('/register', validate({ body: registerBody }), register);
authRoutes.post('/login', validate({ body: loginBody }), login);
authRoutes.get('/me', authenticate, me);
authRoutes.post('/refresh', requireXhr, refresh);
authRoutes.post('/logout', requireXhr, logout);
