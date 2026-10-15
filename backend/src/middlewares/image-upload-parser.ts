import express, { type Request } from 'express';

export const IMAGE_UPLOAD_LIMIT = '6mb';

const IMAGE_UPLOADS: { method: string; path: RegExp }[] = [
  { method: 'PUT', path: /^\/api\/admin\/(events|news)\/[^/]+\/image$/ },
  { method: 'POST', path: /^\/api\/admin\/gallery\/?$/ },
];

export const isImageUpload = (req: Pick<Request, 'method' | 'path'>): boolean =>
  IMAGE_UPLOADS.some((upload) => upload.method === req.method && upload.path.test(req.path));

export const parseImageUpload = express.json({ limit: IMAGE_UPLOAD_LIMIT });
