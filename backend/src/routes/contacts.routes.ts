import { Router } from 'express';
import { contactBody, createContact } from '../controllers/contacts.controller';
import { validate } from '../middlewares/validate';

export const contactsRoutes = Router();

contactsRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

contactsRoutes.post('/', validate({ body: contactBody }), createContact);
