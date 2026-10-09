import { Router } from 'express';
import { downloadReport, getReport, reportQuery } from '../controllers/admin-report.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireStaff } from '../middlewares/require-staff';
import { validate } from '../middlewares/validate';

// Counts only, read-only. The spreadsheet carries the same numbers: no name, e-mail or document leaves through here.
export const adminReportRoutes = Router();

adminReportRoutes.use(authenticate, requireStaff);
adminReportRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

adminReportRoutes.get('/', validate({ query: reportQuery }), getReport);
adminReportRoutes.get('/csv', validate({ query: reportQuery }), downloadReport);
