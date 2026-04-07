import { Request, Response, NextFunction, Router } from 'express';
import { CommentsService } from './comments.service';
import { authenticate } from '@/modules/auth/jwt.middleware';
import { validateDto } from '@utils';
import { createCommentSchema, updateCommentSchema, queryCommentsSchema } from './schemas';

export class CommentsController {
  public router: Router;

  constructor(private readonly commentsService: CommentsService) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authenticate);
    this.router.get('/:id/replies', this.getReplies.bind(this));
    this.router.get('/', this.getComments.bind(this));
    this.router.post('/', this.create.bind(this));
    this.router.patch('/:id', this.update.bind(this));
    this.router.delete('/:id', this.delete.bind(this));
  }

  async getReplies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.commentsService.getReplies(req.user!.id, req.params.id as string);
      res.json(result);
    } catch (error) { next(error); }
  }

  async getComments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = validateDto(queryCommentsSchema, req.query);
      const result = await this.commentsService.getComments(req.user!.id, query);
      res.json(result);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = validateDto(createCommentSchema, req.body);
      const result = await this.commentsService.create(req.user!.id, input);
      res.status(201).json(result);
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = validateDto(updateCommentSchema, req.body);
      const result = await this.commentsService.update(req.user!.id, req.params.id as string, input);
      res.json(result);
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.commentsService.delete(req.user!.id, req.params.id as string);
      res.status(204).send();
    } catch (error) { next(error); }
  }
}
