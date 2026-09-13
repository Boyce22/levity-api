import type { UploadResult } from '../../src/contracts';
import type { StoragePort } from '../../src/modules/files/storage.port';

interface StoredFile {
  buffer: Buffer;
  mimeType: string;
}

export class InMemoryStorage implements StoragePort {
  private readonly files = new Map<string, StoredFile>();

  async upload(buffer: Buffer, key: string, mimeType: string): Promise<UploadResult> {
    this.files.set(key, { buffer, mimeType });
    return { url: `memory://${key}`, publicId: key };
  }

  async download(key: string): Promise<{ data: Buffer; mimeType: string }> {
    const file = this.files.get(key);
    if (!file) throw new Error(`File not found: ${key}`);
    return { data: file.buffer, mimeType: file.mimeType };
  }

  async getSignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    return `memory://signed/${key}?exp=${expiresInSeconds}`;
  }

  async delete(key: string): Promise<void> {
    this.files.delete(key);
  }

  clear(): void {
    this.files.clear();
  }
}

export const inMemoryStorage = new InMemoryStorage();
