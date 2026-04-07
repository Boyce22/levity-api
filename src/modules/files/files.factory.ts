import pino from 'pino';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { createStorageProvider } from '@/shared/storage/storage.factory';
import { CompressorService } from '@/shared/storage/compressor.service';
import { memberRepository } from '@/modules/workspaces/workspace.factory';

const logger = pino({ name: 'files' });
const storage = createStorageProvider();
const compressor = new CompressorService();

const filesService = new FilesService(storage, compressor, memberRepository, logger);
export const filesController = new FilesController(filesService);
export const filesRouter = filesController.router;
