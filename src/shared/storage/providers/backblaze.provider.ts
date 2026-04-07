import Backblaze from 'backblaze-b2';
import { IStorageProvider, UploadResult } from '../interfaces/storage.interface';

export class BackblazeProvider implements IStorageProvider {
  private b2: InstanceType<typeof Backblaze>;
  private authorized = false;

  constructor() {
    this.b2 = new Backblaze({
      applicationKeyId: process.env.BACKBLAZE_KEY_ID!,
      applicationKey: process.env.BACKBLAZE_APP_KEY!,
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

    const bucketId = process.env.BACKBLAZE_BUCKET_ID!;
    const bucketName = process.env.BACKBLAZE_BUCKET_NAME!;

    const { data: uploadUrl } = await this.b2.getUploadUrl({ bucketId });

    const { data } = await this.b2.uploadFile({
      uploadUrl: uploadUrl.uploadUrl,
      uploadAuthToken: uploadUrl.authorizationToken,
      fileName: key,
      data: buffer,
      mime: mimeType,
      onUploadProgress: null,
    });

    const url = `/file/${bucketName}/${key}`;

    return { url, publicId: data.fileId };
  }

  async delete(key: string): Promise<void> {
    await this.authorize();

    const { data } = await this.b2.listFileNames({
      bucketId: process.env.BACKBLAZE_BUCKET_ID!,
      startFileName: key,
      maxFileCount: 1,
    });

    const file = data.files.find((f: { fileName: string }) => f.fileName === key);
    if (file) {
      await this.b2.deleteFileVersion({ fileId: file.fileId, fileName: key });
    }
  }
}
