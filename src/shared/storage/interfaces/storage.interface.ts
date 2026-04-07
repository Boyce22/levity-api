export interface UploadOptions {
  filename?: string;
  folder?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export interface UploadResult {
  url: string;
  publicId: string;
}

export interface IStorageProvider {
  upload(buffer: Buffer, key: string, mimeType: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
}
