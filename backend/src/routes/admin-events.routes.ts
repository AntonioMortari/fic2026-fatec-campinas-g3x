import { Router } from 'express';
import {
  adminEventParams,
  create,
  downloadRegistrations,
  eventBody,
  getEvent,
  getRegistrations,
  listEvents,
  publicationBody,
  setPublication,
  update,
} from '../controllers/admin-events.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireStaff } from '../middlewares/require-staff';
import { validate } from '../middlewares/validate';

// There is no DELETE: removing an event would take its sign-ups with it (RF13). The sign-ups are read-only here (RF16):
// the staff reads and exports what people wrote, never corrects or deletes it.
export const adminEventsRoutes = Router();

adminEventsRoutes.use(authenticate, requireStaff);
adminEventsRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

adminEventsRoutes.get('/', listEvents);
adminEventsRoutes.post('/', validate({ body: eventBody }), create);
adminEventsRoutes.get('/:id', validate({ params: adminEventParams }), getEvent);
adminEventsRoutes.put('/:id', validate({ params: adminEventParams, body: eventBody }), update);
adminEventsRoutes.patch('/:id/publication', validate({ params: adminEventParams, body: publicationBody }), setPublication);
adminEventsRoutes.get('/:id/registrations', validate({ params: adminEventParams }), getRegistrations);
adminEventsRoutes.get('/:id/registrations.csv', validate({ params: adminEventParams }), downloadRegistrations);
