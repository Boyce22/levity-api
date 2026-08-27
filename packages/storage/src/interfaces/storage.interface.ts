import type { UploadResult } from '@levity/domain';

export interface IStorageProvider {
  upload(buffer: Buffer, key: string, mimeType: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
}
