import { Router } from 'express';
import { getImage, getPhotoForStaff, listPhotosForStaff, remove, setPublication, upload } from '../controllers/admin-gallery.controller';
import { authenticate } from '../middlewares/authenticate';
import { parseImageUpload } from '../middlewares/image-upload-parser';
import { requireStaff } from '../middlewares/require-staff';
import { validate } from '../middlewares/validate';
import { adminGalleryParams, publicationBody, uploadBody } from '../validators/admin-gallery.validator';

// There is no PUT: a photo cannot be edited, only replaced by uploading another and deleting this one (design 11j).
export const adminGalleryRoutes = Router();

adminGalleryRoutes.use(authenticate, requireStaff);
adminGalleryRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

adminGalleryRoutes.get('/', listPhotosForStaff);
adminGalleryRoutes.post('/', parseImageUpload, validate({ body: uploadBody }), upload);
adminGalleryRoutes.get('/:id', validate({ params: adminGalleryParams }), getPhotoForStaff);
adminGalleryRoutes.patch('/:id/publication', validate({ params: adminGalleryParams, body: publicationBody }), setPublication);
adminGalleryRoutes.get('/:id/image', validate({ params: adminGalleryParams }), getImage);
adminGalleryRoutes.delete('/:id', validate({ params: adminGalleryParams }), remove);
