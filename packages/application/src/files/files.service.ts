import { randomUUID } from 'crypto';
import path from 'path';
import type { Logger } from 'pino';
import type { UploadResult, UploadedFile } from '@levity/domain';
import type { WorkspaceMemberRepository } from '@levity/persistence';
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

  async deleteFile(userId: string, workspaceId: string, key: string): Promise<void> {
    await this.memberRepository.assertMember(userId, workspaceId);
    await this.storage.delete(key);
    this.logger.info({ userId, workspaceId, key }, 'File deleted');
  }
}
