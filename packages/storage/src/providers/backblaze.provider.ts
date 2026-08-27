import Backblaze from 'backblaze-b2';
import type { UploadResult } from '@levity/domain';
import type { IStorageProvider } from '../interfaces/storage.interface';

export interface BackblazeCredentials {
  applicationKeyId: string;
  applicationKey: string;
  bucketId: string;
  bucketName: string;
}

export class BackblazeProvider implements IStorageProvider {
  private readonly b2: InstanceType<typeof Backblaze>;
  private authorized = false;

  constructor(private readonly credentials: BackblazeCredentials) {
    this.b2 = new Backblaze({
      applicationKeyId: credentials.applicationKeyId,
      applicationKey: credentials.applicationKey,
    });
  }

  private async authorize(): Promise<void> {
    if (!this.authorized) {
      await this.b2.authorize();
      this.authorized = true;
    }
  }

  async upload(buffer: Buffer, key: string, mimeType: string): Promise<UploadResult> {
    await this.authorize();

    const { data: uploadUrl } = await this.b2.getUploadUrl({ bucketId: this.credentials.bucketId });

    const { data } = await this.b2.uploadFile({
      uploadUrl: uploadUrl.uploadUrl,
      uploadAuthToken: uploadUrl.authorizationToken,
      fileName: key,
      data: buffer,
      mime: mimeType,
      onUploadProgress: null,
    });

    const url = `/file/${this.credentials.bucketName}/${key}`;

    return { url, publicId: data.fileId };
  }

  async delete(key: string): Promise<void> {
    await this.authorize();

    const { data } = await this.b2.listFileNames({
      bucketId: this.credentials.bucketId,
      startFileName: key,
      maxFileCount: 1,
    });

    const file = data.files.find((f: { fileName: string }) => f.fileName === key);
    if (file) {
      await this.b2.deleteFileVersion({ fileId: file.fileId, fileName: key });
    }
  }
}
