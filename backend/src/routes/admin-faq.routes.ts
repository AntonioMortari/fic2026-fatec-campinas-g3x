import { Router } from 'express';
import {
  createItem,
  createTheme,
  listForStaff,
  moveItem,
  moveTheme,
  renameTheme,
  setItemPublication,
  setThemePublication,
  updateItem,
} from '../controllers/admin-faq.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireStaff } from '../middlewares/require-staff';
import { validate } from '../middlewares/validate';
import { faqItemBody, faqItemParams, faqPositionBody, faqPublicationBody, faqThemeBody, faqThemeParams } from '../validators/admin-faq.validator';

// There is no DELETE: taking a question or a theme down keeps it stored and reversible (design 18).
export const adminFaqRoutes = Router();

adminFaqRoutes.use(authenticate, requireStaff);
adminFaqRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

adminFaqRoutes.get('/', listForStaff);

adminFaqRoutes.post('/items', validate({ body: faqItemBody }), createItem);
adminFaqRoutes.put('/items/:id', validate({ params: faqItemParams, body: faqItemBody }), updateItem);
adminFaqRoutes.patch('/items/:id/publication', validate({ params: faqItemParams, body: faqPublicationBody }), setItemPublication);
adminFaqRoutes.patch('/items/:id/position', validate({ params: faqItemParams, body: faqPositionBody }), moveItem);

adminFaqRoutes.post('/themes', validate({ body: faqThemeBody }), createTheme);
adminFaqRoutes.put('/themes/:id', validate({ params: faqThemeParams, body: faqThemeBody }), renameTheme);
adminFaqRoutes.patch('/themes/:id/publication', validate({ params: faqThemeParams, body: faqPublicationBody }), setThemePublication);
adminFaqRoutes.patch('/themes/:id/position', validate({ params: faqThemeParams, body: faqPositionBody }), moveTheme);
