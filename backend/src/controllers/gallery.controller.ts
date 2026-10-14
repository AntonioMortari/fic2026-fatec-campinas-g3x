import type { Request, Response } from 'express';
import { findPublishedPhotoImage, listPublicAlbums, PHOTO_NOT_FOUND_MESSAGE } from '../services/gallery.service';
import { ApiError } from '../utils/api-error';
import { sendStoredImage } from '../utils/send-stored-image';

export async function listGallery(_req: Request, res: Response): Promise<void> {
  res.json({ data: await listPublicAlbums() });
}

export async function getGalleryImage(req: Request, res: Response): Promise<void> {
  const photo = await findPublishedPhotoImage(req.params.id as string);
  if (!photo) throw new ApiError(404, 'photo_not_found', PHOTO_NOT_FOUND_MESSAGE);
  await sendStoredImage(res, photo, 'public, max-age=300', PHOTO_NOT_FOUND_MESSAGE);
}
