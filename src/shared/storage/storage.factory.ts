import { IStorageProvider } from './interfaces/storage.interface';

export function createStorageProvider(): IStorageProvider {
  const provider = process.env.STORAGE_PROVIDER ?? 'backblaze';

  switch (provider) {
    case 'backblaze': {
      const { BackblazeProvider } = require('./providers/backblaze.provider');
      return new BackblazeProvider();
    }
    case 's3': {
      const { S3Provider } = require('./providers/s3.provider');
      return new S3Provider();
    }
    case 'cloudinary': {
      const { CloudinaryProvider } = require('./providers/cloudinary.provider');
      return new CloudinaryProvider();
    }
    default:
      throw new Error(`Unknown storage provider: ${provider}`);
  }
}
