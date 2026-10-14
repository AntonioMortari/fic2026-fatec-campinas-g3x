import type { Request, Response } from 'express';
import type { z } from 'zod';
import { deletePhoto, findPhotoImageForStaff, getAdminPhoto, listAdminPhotos, setPhotoPublished, uploadPhoto } from '../services/admin-gallery.service';
import { PHOTO_NOT_FOUND_MESSAGE } from '../services/gallery.service';
import { sendStoredImage } from '../utils/send-stored-image';
import type { publicationBody, uploadBody } from '../validators/admin-gallery.validator';

export async function listPhotosForStaff(_req: Request, res: Response): Promise<void> {
  res.json({ data: await listAdminPhotos() });
}

export async function getPhotoForStaff(req: Request, res: Response): Promise<void> {
  res.json({ photo: await getAdminPhoto(req.params.id as string) });
}

export async function upload(req: Request, res: Response): Promise<void> {
  const { data, album, alt, caption, authorized } = req.body as z.output<typeof uploadBody>;
  res.status(201).json({ photo: await uploadPhoto({ data, album, alt, caption, authorized }) });
}

export async function setPublication(req: Request, res: Response): Promise<void> {
  const { published } = req.body as z.output<typeof publicationBody>;
  res.json({ photo: await setPhotoPublished(req.params.id as string, published) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deletePhoto(req.params.id as string);
  res.status(204).end();
}

export async function getImage(req: Request, res: Response): Promise<void> {
  await sendStoredImage(res, await findPhotoImageForStaff(req.params.id as string), 'private, no-store', PHOTO_NOT_FOUND_MESSAGE);
}
