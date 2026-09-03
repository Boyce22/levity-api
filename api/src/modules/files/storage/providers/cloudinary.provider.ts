import { ExternalServiceError } from '../../../../shared/index';
import type { UploadResult } from '../../../../domain/index';
import type { StoragePort } from '../../storage.port';

export class CloudinaryProvider implements StoragePort {
  async upload(_file: Buffer, _key: string, _mimeType: string): Promise<UploadResult> {
    throw new ExternalServiceError('cloudinary', 'CloudinaryProvider.upload not implemented');
  }

  async download(_key: string): Promise<{ data: Buffer; mimeType: string }> {
    throw new ExternalServiceError('cloudinary', 'CloudinaryProvider.download not implemented');
  }

  async getSignedUrl(_key: string, _expiresInSeconds: number): Promise<string> {
    throw new ExternalServiceError('cloudinary', 'CloudinaryProvider.getSignedUrl not implemented');
  }

  async delete(_key: string): Promise<void> {
    throw new ExternalServiceError('cloudinary', 'CloudinaryProvider.delete not implemented');
  }
}
