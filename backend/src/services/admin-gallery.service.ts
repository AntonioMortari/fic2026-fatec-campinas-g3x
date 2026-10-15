import { GalleryPhoto } from '../models';
import { ApiError } from '../utils/api-error';
import { deleteImageFile, saveImageFile } from '../utils/event-image-storage';
import { detectImageMime } from '../utils/image-signature';
import { PHOTO_NOT_FOUND_MESSAGE } from './gallery.service';

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export type PhotoState = 'live' | 'stored' | 'unauthorized';

export interface AdminPhoto {
  id: string;
  album: string;
  alt: string;
  caption: string | null;
  state: PhotoState;
  published: boolean;
  authorized: boolean;
  publishedAt: string | null;
  uploadedAt: string;
  imageUrl: string;
}

export interface UploadInput {
  data: Buffer;
  album: string;
  alt: string;
  caption: string | null;
  authorized: boolean;
}

const notFound = () => new ApiError(404, 'photo_not_found', PHOTO_NOT_FOUND_MESSAGE);

export function photoState(photo: Pick<GalleryPhoto, 'authorizedAt' | 'published'>): PhotoState {
  if (!photo.authorizedAt) return 'unauthorized';
  return photo.published ? 'live' : 'stored';
}

function toAdminPhoto(photo: GalleryPhoto): AdminPhoto {
  return {
    id: photo.id,
    album: photo.album,
    alt: photo.alt,
    caption: photo.caption,
    state: photoState(photo),
    published: photo.published,
    authorized: Boolean(photo.authorizedAt),
    publishedAt: photo.publishedAt?.toISOString() ?? null,
    uploadedAt: photo.createdAt.toISOString(),
    imageUrl: `/api/admin/gallery/${photo.id}/image?v=${photo.imageUpdatedAt.getTime()}`,
  };
}

async function findOrFail(id: string): Promise<GalleryPhoto> {
  const photo = await GalleryPhoto.findByPk(id);
  if (!photo) throw notFound();
  return photo;
}

export async function listAdminPhotos(): Promise<AdminPhoto[]> {
  const rows = await GalleryPhoto.findAll({ order: [['createdAt', 'DESC']] });
  return rows.map(toAdminPhoto);
}

export async function getAdminPhoto(id: string): Promise<AdminPhoto> {
  return toAdminPhoto(await findOrFail(id));
}

const imageError = (status: number, code: string, message: string) =>
  new ApiError(status, code, message, [{ location: 'body', field: 'data', message }]);

// The declaration is optional on purpose (design 11j): without it the photo is kept but can never go public.
export async function uploadPhoto(input: UploadInput, now: Date = new Date()): Promise<AdminPhoto> {
  if (input.data.length > MAX_IMAGE_BYTES) throw imageError(413, 'image_too_large', 'A foto passou de 4 MB. Escolha uma menor.');
  const mime = detectImageMime(input.data);
  if (!mime) throw imageError(400, 'invalid_image', 'O arquivo não é uma imagem JPG, PNG, GIF ou WebP.');

  const file = await saveImageFile(input.data, mime);
  try {
    const photo = await GalleryPhoto.create({
      album: input.album,
      alt: input.alt,
      caption: input.caption,
      imageFile: file,
      imageMime: mime,
      imageUpdatedAt: now,
      authorizedAt: input.authorized ? now : null,
      published: false,
    });
    return toAdminPhoto(photo);
  } catch (error) {
    await deleteImageFile(file);
    throw error;
  }
}

// The date is stamped on the first publication only; taking it down keeps it, because it is a fact.
export async function setPhotoPublished(id: string, published: boolean, now: Date = new Date()): Promise<AdminPhoto> {
  const photo = await findOrFail(id);
  if (published && !photo.authorizedAt) {
    throw new ApiError(409, 'authorization_missing', 'Esta foto não pode ir ao ar: a autorização de uso de imagem não foi declarada quando ela subiu.');
  }
  const stampsDate = published && !photo.publishedAt;
  await photo.update(stampsDate ? { published, publishedAt: now } : { published }, { fields: stampsDate ? ['published', 'publishedAt'] : ['published'] });
  return toAdminPhoto(photo);
}

export type TextInput = Pick<UploadInput, 'album' | 'alt' | 'caption'>;

export async function updatePhotoText(id: string, input: TextInput): Promise<AdminPhoto> {
  const photo = await findOrFail(id);
  await photo.update({ album: input.album, alt: input.alt, caption: input.caption }, { fields: ['album', 'alt', 'caption'] });
  return toAdminPhoto(photo);
}

export async function deletePhoto(id: string): Promise<void> {
  const photo = await findOrFail(id);
  await photo.destroy();
  await deleteImageFile(photo.imageFile);
}

export async function findPhotoImageForStaff(id: string): Promise<GalleryPhoto> {
  const photo = await GalleryPhoto.findOne({ attributes: ['id', 'imageFile', 'imageMime', 'imageUpdatedAt'], where: { id } });
  if (!photo) throw notFound();
  return photo;
}
