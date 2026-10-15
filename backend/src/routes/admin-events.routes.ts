import { Router } from 'express';
import {
  create,
  deleteImage,
  downloadRegistrations,
  getAttendance,
  getEvent,
  getImage,
  getRegistrations,
  listEvents,
  markAttendance,
  putImage,
  setPublication,
  update,
} from '../controllers/admin-events.controller';
import { adminEventParams, attendanceBody, attendanceParams, eventBody, imageBody, publicationBody } from '../validators/admin-events.validator';
import { authenticate } from '../middlewares/authenticate';
import { requireStaff } from '../middlewares/require-staff';
import { parseImageUpload } from '../middlewares/image-upload-parser';
import { validate } from '../middlewares/validate';

// There is no DELETE: removing an event would take its sign-ups with it (RF13). The sign-ups are read-only here (RF16):
// the staff reads and exports what people wrote, never corrects or deletes it. The only thing the staff writes there is the attendance mark (RF17).
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
adminEventsRoutes.get('/:id/attendance', validate({ params: adminEventParams }), getAttendance);
adminEventsRoutes.patch('/:id/attendance/:registrationId', validate({ params: attendanceParams, body: attendanceBody }), markAttendance);
adminEventsRoutes.get('/:id/image', validate({ params: adminEventParams }), getImage);
adminEventsRoutes.put('/:id/image', parseImageUpload, validate({ params: adminEventParams, body: imageBody }), putImage);
adminEventsRoutes.delete('/:id/image', validate({ params: adminEventParams }), deleteImage);
