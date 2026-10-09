import { Router } from 'express';
import { getMyRegistrations } from '../controllers/me.controller';
import { authenticate } from '../middlewares/authenticate';

export const meRoutes = Router();

meRoutes.use(authenticate);
meRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

meRoutes.get('/registrations', getMyRegistrations);
