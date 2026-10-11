import { Router } from 'express';
import { apply, applicationBody, getAreas } from '../controllers/volunteers.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';

export const volunteerAreasRoutes = Router();

volunteerAreasRoutes.get('/', getAreas);

export const volunteerApplicationsRoutes = Router();

volunteerApplicationsRoutes.use(authenticate);
volunteerApplicationsRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

volunteerApplicationsRoutes.post('/', validate({ body: applicationBody }), apply);
