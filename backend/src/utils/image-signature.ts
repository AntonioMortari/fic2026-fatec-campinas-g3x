export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
export type ImageMime = (typeof IMAGE_MIME_TYPES)[number];

const startsWith = (buffer: Buffer, bytes: number[], offset = 0) => bytes.every((byte, index) => buffer[offset + index] === byte);
const ascii = (text: string) => [...text].map((char) => char.charCodeAt(0));

export function detectImageMime(buffer: Buffer): ImageMime | null {
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (startsWith(buffer, ascii('GIF87a')) || startsWith(buffer, ascii('GIF89a'))) return 'image/gif';
  if (buffer.length >= 12 && startsWith(buffer, ascii('RIFF')) && startsWith(buffer, ascii('WEBP'), 8)) return 'image/webp';
  return null;
}
