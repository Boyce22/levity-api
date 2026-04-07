import { Request, Response, NextFunction, Router } from 'express';
import { DiagramsService } from './diagrams.service';
import { authenticate } from '@/modules/auth/jwt.middleware';
import { validateDto } from '@utils';
import { saveDiagramSchema } from './schemas';

export class DiagramsController {
  public router: Router;

  constructor(private readonly diagramsService: DiagramsService) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authenticate);
    this.router.get('/:cardId', this.get.bind(this));
    this.router.put('/', this.save.bind(this));
    this.router.delete('/:cardId', this.delete.bind(this));
  }

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.diagramsService.get(req.user!.id, req.params.cardId as string);
      res.json(result ?? null);
    } catch (error) { next(error); }
  }

  async save(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = validateDto(saveDiagramSchema, req.body);
      const result = await this.diagramsService.save(req.user!.id, input);
      res.json(result);
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.diagramsService.delete(req.user!.id, req.params.cardId as string);
      res.status(204).send();
    } catch (error) { next(error); }
  }
}
