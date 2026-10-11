import { Router } from 'express';
import {
  applicationFilters,
  applicationParams,
  areaFilter,
  downloadAdminApplications,
  getAdminApplication,
  getAdminCounts,
  listAdminApplications,
  setAdminApplicationStatus,
  statusBody,
} from '../controllers/volunteers.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireStaff } from '../middlewares/require-staff';
import { validate } from '../middlewares/validate';

export const adminVolunteersRoutes = Router();

adminVolunteersRoutes.use(authenticate, requireStaff);
adminVolunteersRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

adminVolunteersRoutes.get('/', validate({ query: applicationFilters }), listAdminApplications);
adminVolunteersRoutes.get('/counts', validate({ query: areaFilter }), getAdminCounts);
adminVolunteersRoutes.get('/export.csv', validate({ query: applicationFilters }), downloadAdminApplications);
adminVolunteersRoutes.get('/:id', validate({ params: applicationParams }), getAdminApplication);
adminVolunteersRoutes.patch('/:id/status', validate({ params: applicationParams, body: statusBody }), setAdminApplicationStatus);
