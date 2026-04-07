import { IStorageProvider, UploadResult } from '../interfaces/storage.interface';

export class CloudinaryProvider implements IStorageProvider {
  async upload(_file: Buffer, _key: string, _mimeType: string): Promise<UploadResult> {
    throw new Error('CloudinaryProvider.upload not implemented');
  }

  async delete(_key: string): Promise<void> {
    throw new Error('CloudinaryProvider.delete not implemented');
  }
}
