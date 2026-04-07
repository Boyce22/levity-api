import { IStorageProvider, UploadResult } from '../interfaces/storage.interface';

export class S3Provider implements IStorageProvider {
  async upload(_file: Buffer, _key: string, _mimeType: string): Promise<UploadResult> {
    // TODO: implement with @aws-sdk/client-s3
    throw new Error('S3Provider.upload not implemented');
  }

  async delete(_key: string): Promise<void> {
    // TODO: implement with @aws-sdk/client-s3
    throw new Error('S3Provider.delete not implemented');
  }
}
