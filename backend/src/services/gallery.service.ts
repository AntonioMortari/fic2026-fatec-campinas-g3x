import { Op } from 'sequelize';
import { GalleryPhoto } from '../models';

export interface PublicPhoto {
  id: string;
  alt: string;
  caption: string | null;
  url: string;
}

export interface PublicAlbum {
  name: string;
  photos: PublicPhoto[];
}

export const PHOTO_NOT_FOUND_MESSAGE = 'Não encontramos essa foto.';

// Albums are the album name as the team typed it; "II festa preta" and "II Festa Preta" are the same album.
const albumKey = (name: string) => name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');

// A photo is public only when it is published AND the authorization was declared. The table also enforces it; this is the second lock.
export const publicPhotoFilter = { published: true, authorizedAt: { [Op.ne]: null } };

const photoUrl = (photo: Pick<GalleryPhoto, 'id' | 'imageUpdatedAt'>, base: string) => `${base}/${photo.id}/image?v=${photo.imageUpdatedAt.getTime()}`;

export const publicPhotoUrl = (photo: Pick<GalleryPhoto, 'id' | 'imageUpdatedAt'>) => photoUrl(photo, '/api/gallery');

export async function listPublicAlbums(): Promise<PublicAlbum[]> {
  const rows = await GalleryPhoto.findAll({
    attributes: ['id', 'album', 'alt', 'caption', 'imageUpdatedAt', 'publishedAt', 'createdAt'],
    where: publicPhotoFilter,
    order: [['publishedAt', 'ASC'], ['createdAt', 'ASC']],
  });

  const albums = new Map<string, { name: string; latest: number; photos: PublicPhoto[] }>();
  for (const row of rows) {
    const key = albumKey(row.album);
    const album = albums.get(key) ?? { name: row.album, latest: 0, photos: [] };
    album.latest = Math.max(album.latest, (row.publishedAt ?? row.createdAt).getTime());
    album.photos.push({ id: row.id, alt: row.alt, caption: row.caption, url: publicPhotoUrl(row) });
    albums.set(key, album);
  }
  return [...albums.values()].sort((a, b) => b.latest - a.latest).map(({ name, photos }) => ({ name, photos }));
}

export async function findPublishedPhotoImage(id: string): Promise<GalleryPhoto | null> {
  return GalleryPhoto.findOne({ attributes: ['id', 'imageFile', 'imageMime', 'imageUpdatedAt'], where: { id, ...publicPhotoFilter } });
}
