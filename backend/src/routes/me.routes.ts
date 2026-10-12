import { Router } from 'express';
import { getMyRegistrations, updateMe } from '../controllers/me.controller';
import { profileBody } from '../validators/me.validator';
import { authenticate } from '../middlewares/authenticate';
import { getMyApplications } from '../controllers/volunteers.controller';
import { validate } from '../middlewares/validate';

export const meRoutes = Router();

meRoutes.use(authenticate);
meRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

meRoutes.get('/registrations', getMyRegistrations);
meRoutes.get('/volunteer-applications', getMyApplications);
meRoutes.patch('/', validate({ body: profileBody }), updateMe);
