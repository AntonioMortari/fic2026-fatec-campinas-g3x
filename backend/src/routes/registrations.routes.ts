import { Router } from 'express';
import { cancel, cancelParams, previewCancellation } from '../controllers/registrations.controller';
import { validate } from '../middlewares/validate';

// Open on purpose: nobody has to sign in to give up a spot (RF15 works without an account). The personal link, a random
// UUID, is the proof. Never cached: the answer changes the moment the sign-up is cancelled.
export const registrationsRoutes = Router();

registrationsRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

registrationsRoutes.get('/cancel/:code', validate({ params: cancelParams }), previewCancellation);
registrationsRoutes.post('/cancel/:code', validate({ params: cancelParams }), cancel);
