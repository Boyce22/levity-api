import { Request, Response, NextFunction, Router } from 'express';
import { SettingsService } from '../services/settings.service';
import { authenticate } from '@/modules/auth/jwt.middleware';
import { validateDto } from '@utils';
import { createTagSchema, createPrioritySchema } from '../schemas';

export class SettingsController {
  public router: Router;

  constructor(private readonly settingsService: SettingsService) {
    this.router = Router({ mergeParams: true });
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authenticate);
    this.router.get('/tags', this.getTags.bind(this));
    this.router.post('/tags', this.createTag.bind(this));
    this.router.delete('/tags/:tagId', this.deleteTag.bind(this));
    this.router.get('/priorities', this.getPriorities.bind(this));
    this.router.post('/priorities', this.createPriority.bind(this));
    this.router.delete('/priorities/:priorityId', this.deletePriority.bind(this));
  }

  async getTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.settingsService.getTags(req.user!.id, req.params.id as string);
      res.json(result);
    } catch (error) { next(error); }
  }

  async createTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = validateDto(createTagSchema, req.body);
      const result = await this.settingsService.createTag(req.user!.id, req.params.id as string, input);
      res.status(201).json(result);
    } catch (error) { next(error); }
  }

  async deleteTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.settingsService.deleteTag(req.user!.id, req.params.id as string, req.params.tagId as string);
      res.status(204).send();
    } catch (error) { next(error); }
  }

  async getPriorities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.settingsService.getPriorities(req.user!.id, req.params.id as string);
      res.json(result);
    } catch (error) { next(error); }
  }

  async createPriority(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = validateDto(createPrioritySchema, req.body);
      const result = await this.settingsService.createPriority(req.user!.id, req.params.id as string, input);
      res.status(201).json(result);
    } catch (error) { next(error); }
  }

  async deletePriority(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.settingsService.deletePriority(req.user!.id, req.params.id as string, req.params.priorityId as string);
      res.status(204).send();
    } catch (error) { next(error); }
  }
}
