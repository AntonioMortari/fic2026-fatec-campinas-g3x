import { Router } from 'express';
import { getMyRegistrations, profileBody, updateMe } from '../controllers/me.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';

export const meRoutes = Router();

meRoutes.use(authenticate);
meRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

meRoutes.get('/registrations', getMyRegistrations);
meRoutes.patch('/', validate({ body: profileBody }), updateMe);
