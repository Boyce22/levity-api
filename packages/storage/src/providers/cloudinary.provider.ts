import { ExternalServiceError } from '@levity/observability';
import type { UploadResult } from '@levity/domain';
import type { IStorageProvider } from '../interfaces/storage.interface';

export class CloudinaryProvider implements IStorageProvider {
  async upload(_file: Buffer, _key: string, _mimeType: string): Promise<UploadResult> {
    throw new ExternalServiceError('cloudinary', 'CloudinaryProvider.upload not implemented');
  }

  async delete(_key: string): Promise<void> {
    throw new ExternalServiceError('cloudinary', 'CloudinaryProvider.delete not implemented');
  }
}
