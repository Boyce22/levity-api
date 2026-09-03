import { env, type Env } from '../../../config/index';
import { ExternalServiceError } from '../../../shared/index';
import type { StoragePort } from '../storage.port';
import { BackblazeProvider } from './providers/backblaze.provider';
import { S3Provider } from './providers/s3.provider';
import { CloudinaryProvider } from './providers/cloudinary.provider';

export function createStorageProvider(config: Env = env): StoragePort {
  switch (config.STORAGE_PROVIDER) {
    case 'backblaze':
      return new BackblazeProvider({
        applicationKeyId: config.BACKBLAZE_KEY_ID ?? '',
        applicationKey: config.BACKBLAZE_APP_KEY ?? '',
        bucketId: config.BACKBLAZE_BUCKET_ID ?? '',
        bucketName: config.BACKBLAZE_BUCKET_NAME ?? '',
        downloadUrl: config.BACKBLAZE_DOWNLOAD_URL,
      });
    case 's3':
      return new S3Provider();
    case 'cloudinary':
      return new CloudinaryProvider();
    default:
      throw new ExternalServiceError('storage', `Unknown storage provider: ${config.STORAGE_PROVIDER}`);
  }
}
