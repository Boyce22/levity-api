import { ExternalServiceError } from '../../../../shared/index';
import type { UploadResult } from '../../../../domain/index';
import type { StoragePort } from '../../storage.port';

export class S3Provider implements StoragePort {
  async upload(_file: Buffer, _key: string, _mimeType: string): Promise<UploadResult> {
    throw new ExternalServiceError('s3', 'S3Provider.upload not implemented');
  }

  async download(_key: string): Promise<{ data: Buffer; mimeType: string }> {
    throw new ExternalServiceError('s3', 'S3Provider.download not implemented');
  }

  async getSignedUrl(_key: string, _expiresInSeconds: number): Promise<string> {
    throw new ExternalServiceError('s3', 'S3Provider.getSignedUrl not implemented');
  }

  async delete(_key: string): Promise<void> {
    throw new ExternalServiceError('s3', 'S3Provider.delete not implemented');
  }
}
