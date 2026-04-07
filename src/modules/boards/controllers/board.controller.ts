import { Request, Response, NextFunction, Router } from 'express';
import { BoardService } from '../services/board.service';
import { authenticate } from '@/modules/auth/jwt.middleware';
import { validateDto } from '@utils';
import {
  createListSchema,
  updateListSchema,
  updateListPositionsSchema,
  createCardSchema,
  updateCardSchema,
  updateCardPositionsSchema,
} from '../schemas';

export class BoardController {
  public router: Router;

  constructor(private readonly boardService: BoardService) {
    this.router = Router({ mergeParams: true });
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authenticate);

    // Board data
    this.router.get('/board', this.getBoardData.bind(this));

    // Lists
    this.router.post('/lists', this.createList.bind(this));
    this.router.patch('/lists/positions', this.updateListPositions.bind(this));
    this.router.patch('/lists/:listId', this.updateList.bind(this));
    this.router.delete('/lists/:listId', this.deleteList.bind(this));

    // Cards
    this.router.post('/cards', this.createCard.bind(this));
    this.router.patch('/cards/positions', this.updateCardPositions.bind(this));
    this.router.patch('/cards/:cardId', this.updateCard.bind(this));
    this.router.delete('/cards/:cardId', this.deleteCard.bind(this));
  }

  async getBoardData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.boardService.getBoardData(req.user!.id, req.params.workspaceId as string);
      res.json(result);
    } catch (error) { next(error); }
  }

  async createList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = validateDto(createListSchema, req.body);
      const result = await this.boardService.createList(req.user!.id, req.params.workspaceId as string, input);
      res.status(201).json(result);
    } catch (error) { next(error); }
  }

  async updateList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = validateDto(updateListSchema, req.body);
      const result = await this.boardService.updateList(req.user!.id, req.params.listId as string, input);
      res.json(result);
    } catch (error) { next(error); }
  }

  async updateListPositions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = validateDto(updateListPositionsSchema, req.body);
      await this.boardService.updateListPositions(req.user!.id, req.params.workspaceId as string, input);
      res.status(204).send();
    } catch (error) { next(error); }
  }

  async deleteList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.boardService.deleteList(req.user!.id, req.params.listId as string);
      res.status(204).send();
    } catch (error) { next(error); }
  }

  async createCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = validateDto(createCardSchema, req.body);
      const result = await this.boardService.createCard(req.user!.id, input);
      res.status(201).json(result);
    } catch (error) { next(error); }
  }

  async updateCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = validateDto(updateCardSchema, req.body);
      const result = await this.boardService.updateCard(req.user!.id, req.params.cardId as string, input);
      res.json(result);
    } catch (error) { next(error); }
  }

  async updateCardPositions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = validateDto(updateCardPositionsSchema, req.body);
      await this.boardService.updateCardPositions(req.user!.id, req.params.workspaceId as string, input);
      res.status(204).send();
    } catch (error) { next(error); }
  }

  async deleteCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.boardService.deleteCard(req.user!.id, req.params.cardId as string);
      res.status(204).send();
    } catch (error) { next(error); }
  }
}
