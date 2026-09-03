import { randomUUID } from 'crypto';
import path from 'path';
import type { Logger } from 'pino';
import type { UploadResult, UploadedFile } from '../../contracts/index';
import { BadRequestError } from '../../shared/index';
import type { WorkspaceMemberRepository } from '../../db/index';
import type { CompressorPort, StoragePort } from './storage.port';

export class FilesService {
  constructor(
    private readonly storage: StoragePort,
    private readonly compressor: CompressorPort,
    private readonly memberRepository: WorkspaceMemberRepository,
    private readonly logger: Logger,
  ) {}

  async uploadAttachment(userId: string, workspaceId: string, file: UploadedFile): Promise<UploadResult> {
    await this.memberRepository.assertMember(userId, workspaceId);

    const ext = path.extname(file.originalname).slice(1) || 'bin';
    const filename = `${userId}_${randomUUID()}.${ext}`;
    const key = `${workspaceId}/attachments/${filename}`;

    let buffer = file.buffer;
    if (file.mimetype.startsWith('image/')) {
      buffer = await this.compressor.compress(buffer, { quality: 80 });
    }

    const result = await this.storage.upload(buffer, key, file.mimetype);
    this.logger.info({ userId, workspaceId, key }, 'File uploaded');
    return result;
  }

  async uploadAvatar(userId: string, file: UploadedFile): Promise<UploadResult> {
    const key = `avatars/${userId}.webp`;
    const buffer = await this.compressor.compress(file.buffer, { width: 256, height: 256, quality: 85 });
    const result = await this.storage.upload(buffer, key, 'image/webp');
    this.logger.info({ userId, key }, 'Avatar uploaded');
    return result;
  }

  async getSignedDownloadUrl(
    userId: string,
    workspaceId: string,
    category: string,
    filename: string,
    expiresInSeconds = 900,
  ): Promise<string> {
    await this.assertAccessToCategory(userId, workspaceId, category);
    const key = this.resolveStorageKey(workspaceId, category, filename);
    return this.storage.getSignedUrl(key, expiresInSeconds);
  }

  async resolveUrl(key: string | null | undefined, ttlSeconds = 3600): Promise<string | undefined> {
    if (!key) return undefined;
    if (key.startsWith('http://') || key.startsWith('https://')) return key;
    return this.storage.getSignedUrl(key, ttlSeconds);
  }

  async resolveUrls(keys: string[], ttlSeconds = 3600): Promise<Map<string, string>> {
    const unique = [...new Set(keys.filter(Boolean))];
    const urls = await Promise.all(unique.map((k) => this.resolveUrl(k, ttlSeconds)));
    return new Map(unique.flatMap((k, i) => (urls[i] ? [[k, urls[i]]] : [])));
  }

  async deleteFile(userId: string, workspaceId: string, key: string): Promise<void> {
    await this.memberRepository.assertMember(userId, workspaceId);
    this.assertKeyBelongsToWorkspace(workspaceId, key);
    await this.storage.delete(key);
    this.logger.info({ userId, workspaceId, key }, 'File deleted');
  }

  private async assertAccessToCategory(userId: string, workspaceId: string, category: string): Promise<void> {
    if (category === 'attachments') {
      await this.memberRepository.assertMember(userId, workspaceId);
    }
  }

  private resolveStorageKey(workspaceId: string, category: string, filename: string): string {
    return category === 'avatars' ? `avatars/${filename}` : `${workspaceId}/${category}/${filename}`;
  }

  private assertKeyBelongsToWorkspace(workspaceId: string, key: string): void {
    if (!key.startsWith(`${workspaceId}/`)) {
      throw new BadRequestError('Invalid file key for workspace');
    }
  }
}
