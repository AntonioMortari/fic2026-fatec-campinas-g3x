import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env';
import type { ImageMime } from './image-signature';

export const STORED_NAME_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|gif|webp)$/;

const EXTENSIONS: Record<ImageMime, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' };

export const uploadsDir = (): string => path.resolve(env.UPLOADS_DIR);

export const isStoredName = (name: unknown): name is string => typeof name === 'string' && STORED_NAME_PATTERN.test(name);

export async function saveImageFile(data: Buffer, mime: ImageMime): Promise<string> {
  const dir = uploadsDir();
  await fs.mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${EXTENSIONS[mime]}`;
  const temporary = path.join(dir, `${randomUUID()}.tmp`);
  try {
    await fs.writeFile(temporary, data, { flag: 'wx' });
    await fs.rename(temporary, path.join(dir, name));
  } catch (error) {
    await fs.rm(temporary, { force: true }).catch(() => undefined);
    throw error;
  }
  return name;
}

export async function deleteImageFile(name: string | null | undefined): Promise<void> {
  if (!isStoredName(name)) return;
  try {
    await fs.rm(path.join(uploadsDir(), name), { force: true });
  } catch (error) {
    console.error('[uploads] could not delete', name, error);
  }
}
