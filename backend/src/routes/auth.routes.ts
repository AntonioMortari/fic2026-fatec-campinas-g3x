import { Router } from 'express';
import { login, loginBody, me, register, registerBody } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';

export const authRoutes = Router();

authRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

authRoutes.post('/register', validate({ body: registerBody }), register);
authRoutes.post('/login', validate({ body: loginBody }), login);
authRoutes.get('/me', authenticate, me);
