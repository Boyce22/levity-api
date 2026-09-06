import type { MultipartFile } from '@fastify/multipart';

export interface UploadResult {
  url: string;
  publicId: string;
}

export interface UploadedFile {
  file: MultipartFile;
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
