import Backblaze from 'backblaze-b2';
import type { UploadResult } from '../../../../contracts/index';
import { ExternalServiceError } from '../../../../shared/index';
import type { StoragePort } from '../../storage.port';

export interface BackblazeCredentials {
  applicationKeyId: string;
  applicationKey: string;
  bucketId: string;
  bucketName: string;
  downloadUrl?: string;
}

export class BackblazeProvider implements StoragePort {
  private readonly b2: InstanceType<typeof Backblaze>;
  private authorized = false;
  private downloadUrl?: string;

  constructor(private readonly credentials: BackblazeCredentials) {
    this.b2 = new Backblaze({
      applicationKeyId: credentials.applicationKeyId,
      applicationKey: credentials.applicationKey,
    });
  }

  private async authorize(): Promise<void> {
    if (!this.authorized) {
      const { data } = await this.b2.authorize();
      this.downloadUrl = this.credentials.downloadUrl ?? data.downloadUrl;
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

    return { url: key, publicId: data.fileId };
  }

  async download(key: string): Promise<{ data: Buffer; mimeType: string }> {
    await this.authorize();

    const { data, headers } = await this.b2.downloadFileByName({
      bucketName: this.credentials.bucketName,
      fileName: key,
    });

    return { data: Buffer.from(data), mimeType: headers['content-type'] };
  }

  async getSignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    await this.authorize();

    if (!this.downloadUrl) {
      throw new ExternalServiceError('backblaze', 'Download URL not available');
    }

    const { data } = await this.b2.getDownloadAuthorization({
      bucketId: this.credentials.bucketId,
      fileNamePrefix: key,
      validDurationInSeconds: expiresInSeconds,
    });

    return `${this.downloadUrl}/file/${this.credentials.bucketName}/${key}?Authorization=${data.authorizationToken}`;
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
