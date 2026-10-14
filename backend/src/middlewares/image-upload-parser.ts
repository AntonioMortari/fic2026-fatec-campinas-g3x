import express, { type Request } from 'express';

export const IMAGE_UPLOAD_LIMIT = '6mb';

const IMAGE_UPLOAD_PATH = /^\/api\/admin\/news\/[^/]+\/image$/;

export const isImageUpload = (req: Pick<Request, 'method' | 'path'>): boolean => req.method === 'PUT' && IMAGE_UPLOAD_PATH.test(req.path);

export const parseImageUpload = express.json({ limit: IMAGE_UPLOAD_LIMIT });
