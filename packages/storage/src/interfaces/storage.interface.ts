import type { UploadResult } from '@levity/domain';

export interface IStorageProvider {
  upload(buffer: Buffer, key: string, mimeType: string): Promise<UploadResult>;
  download(key: string): Promise<{ data: Buffer; mimeType: string }>;
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
}
