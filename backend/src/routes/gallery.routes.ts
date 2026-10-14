import { Router } from 'express';
import { getGalleryImage, listGallery } from '../controllers/gallery.controller';
import { validate } from '../middlewares/validate';
import { galleryParams } from '../validators/gallery.validator';

export const galleryRoutes = Router();

galleryRoutes.get('/', listGallery);
galleryRoutes.get('/:id/image', validate({ params: galleryParams }), getGalleryImage);
