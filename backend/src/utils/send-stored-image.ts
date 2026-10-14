import type { Response } from 'express';
import { uploadsDir, isStoredName } from './event-image-storage';
import { ApiError } from './api-error';

export interface StoredImage {
  imageFile: string | null;
  imageMime: string | null;
  imageUpdatedAt: Date | null;
}

export function sendStoredImage(res: Response, image: StoredImage, cacheControl: string, notFoundMessage: string): Promise<void> {
  const name = image.imageFile;
  if (!isStoredName(name)) throw new ApiError(404, 'image_not_found', notFoundMessage);
  res.set({
    'Content-Type': image.imageMime as string,
    'X-Content-Type-Options': 'nosniff',
    'Content-Disposition': 'inline',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Cache-Control': cacheControl,
    ETag: `"${image.imageUpdatedAt?.getTime() ?? 0}"`,
  });
  return new Promise((resolve, reject) => {
    res.sendFile(name, { root: uploadsDir(), dotfiles: 'deny', etag: false, lastModified: false, cacheControl: false }, (error) => {
      if (!error || res.headersSent) return resolve();
      for (const header of ['Content-Type', 'Content-Disposition', 'Cache-Control', 'ETag']) res.removeHeader(header);
      reject(new ApiError(404, 'image_not_found', notFoundMessage));
    });
  });
}
