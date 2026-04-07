import { Logger } from 'pino';
import { WorkspaceMemberRepository } from '@/modules/workspaces/repositories/workspace-member.repository';
import { IStorageProvider, UploadResult } from '@/shared/storage/interfaces/storage.interface';
import { CompressorService } from '@/shared/storage/compressor.service';
import { BadRequestError } from '@errors';
import path from 'path';
import crypto from 'crypto';

export class FilesService {
  constructor(
    private readonly storage: IStorageProvider,
    private readonly compressor: CompressorService,
    private readonly memberRepository: WorkspaceMemberRepository,
    private readonly logger: Logger,
  ) {}

  async uploadAttachment(
    userId: string,
    workspaceId: string,
    file: Express.Multer.File,
  ): Promise<UploadResult> {
    await this.memberRepository.assertMember(userId, workspaceId);

    const ext = path.extname(file.originalname).slice(1) || 'bin';
    const filename = `${userId}_${crypto.randomUUID()}.${ext}`;
    const key = `${workspaceId}/attachments/${filename}`;

    let buffer = file.buffer;
    if (file.mimetype.startsWith('image/')) {
      buffer = await this.compressor.compress(buffer, { quality: 80 });
    }

    const result = await this.storage.upload(buffer, key, file.mimetype);
    this.logger.info({ userId, workspaceId, key }, 'File uploaded');
    return result;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<UploadResult> {
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
