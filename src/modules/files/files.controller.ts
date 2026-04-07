import { Request, Response, NextFunction, Router } from 'express';
import { FilesService } from './files.service';
import { authenticate } from '@/modules/auth/jwt.middleware';
import { upload } from '@/shared/storage/upload/upload.config';
import { BadRequestError } from '@errors';

export class FilesController {
  public router: Router;

  constructor(private readonly filesService: FilesService) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authenticate);
    this.router.post('/attachments', upload.single('file'), this.uploadAttachment.bind(this));
    this.router.post('/avatar', upload.single('file'), this.uploadAvatar.bind(this));
    this.router.delete('/attachments', this.deleteFile.bind(this));
  }

  async uploadAttachment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) throw new BadRequestError('No file provided');
      const { workspace_id } = req.body;
      if (!workspace_id) throw new BadRequestError('workspace_id is required');

      const result = await this.filesService.uploadAttachment(req.user!.id, workspace_id, req.file);
      res.status(201).json(result);
    } catch (error) { next(error); }
  }

  async uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) throw new BadRequestError('No file provided');
      const result = await this.filesService.uploadAvatar(req.user!.id, req.file);
      res.status(201).json(result);
    } catch (error) { next(error); }
  }

  async deleteFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workspace_id, key } = req.body;
      if (!workspace_id || !key) throw new BadRequestError('workspace_id and key are required');
      await this.filesService.deleteFile(req.user!.id, workspace_id, key);
      res.status(204).send();
    } catch (error) { next(error); }
  }
}
