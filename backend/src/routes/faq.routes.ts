import { Router } from 'express';
import { listFaq } from '../controllers/faq.controller';

export const faqRoutes = Router();

faqRoutes.get('/', listFaq);
