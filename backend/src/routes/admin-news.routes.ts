import { Router } from 'express';
import { create, deleteImage, getImage, getNewsForStaff, listNewsForStaff, putImage, setPublication, update } from '../controllers/admin-news.controller';
import { authenticate } from '../middlewares/authenticate';
import { parseImageUpload } from '../middlewares/image-upload-parser';
import { requireStaff } from '../middlewares/require-staff';
import { validate } from '../middlewares/validate';
import { adminNewsParams, imageBody, newsBody, publicationBody } from '../validators/admin-news.validator';

// There is no DELETE: erasing a piece has no undo. Taking it down keeps the text (design 11n).
export const adminNewsRoutes = Router();

adminNewsRoutes.use(authenticate, requireStaff);
adminNewsRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

adminNewsRoutes.get('/', listNewsForStaff);
adminNewsRoutes.post('/', validate({ body: newsBody }), create);
adminNewsRoutes.get('/:id', validate({ params: adminNewsParams }), getNewsForStaff);
adminNewsRoutes.put('/:id', validate({ params: adminNewsParams, body: newsBody }), update);
adminNewsRoutes.patch('/:id/publication', validate({ params: adminNewsParams, body: publicationBody }), setPublication);
adminNewsRoutes.get('/:id/image', validate({ params: adminNewsParams }), getImage);
adminNewsRoutes.put('/:id/image', parseImageUpload, validate({ params: adminNewsParams, body: imageBody }), putImage);
adminNewsRoutes.delete('/:id/image', validate({ params: adminNewsParams }), deleteImage);
