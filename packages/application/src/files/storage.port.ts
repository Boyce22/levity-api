import type { UploadResult } from '@levity/domain';

export interface StoragePort {
  upload(buffer: Buffer, key: string, mimeType: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
}

export interface CompressOptions {
  quality?: number;
  width?: number;
  height?: number;
}

export interface CompressorPort {
  compress(input: Buffer, options?: CompressOptions): Promise<Buffer>;
}
