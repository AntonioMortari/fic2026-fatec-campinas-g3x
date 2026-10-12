import { Router } from 'express';
import { createContact } from '../controllers/contacts.controller';
import { contactBody } from '../validators/contacts.validator';
import { validate } from '../middlewares/validate';

export const contactsRoutes = Router();

contactsRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

contactsRoutes.post('/', validate({ body: contactBody }), createContact);
