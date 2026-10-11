import { Router } from 'express';
import {
  contactFilters,
  contactListQuery,
  contactParams,
  downloadAdminContacts,
  getAdminContact,
  getAdminContactCounts,
  listAdminContacts,
  triageAdminContact,
  triageBody,
} from '../controllers/admin-contacts.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireStaff } from '../middlewares/require-staff';
import { validate } from '../middlewares/validate';

export const adminContactsRoutes = Router();

adminContactsRoutes.use(authenticate, requireStaff);
adminContactsRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

adminContactsRoutes.get('/', validate({ query: contactListQuery }), listAdminContacts);
adminContactsRoutes.get('/counts', getAdminContactCounts);
adminContactsRoutes.get('/export.csv', validate({ query: contactFilters }), downloadAdminContacts);
adminContactsRoutes.get('/:id', validate({ params: contactParams }), getAdminContact);
adminContactsRoutes.patch('/:id', validate({ params: contactParams, body: triageBody }), triageAdminContact);
