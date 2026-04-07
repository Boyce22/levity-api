import { Request, Response, NextFunction, Router } from 'express';
import { NotificationsService } from './notifications.service';
import { authenticate } from '@/modules/auth/jwt.middleware';
import { validateDto } from '@utils';
import { queryNotificationsSchema } from './schemas';

export class NotificationsController {
  public router: Router;

  constructor(private readonly notificationsService: NotificationsService) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authenticate);
    this.router.get('/', this.getNotifications.bind(this));
    this.router.patch('/:id/read', this.markRead.bind(this));
    this.router.post('/read-all', this.markAllRead.bind(this));
  }

  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = validateDto(queryNotificationsSchema, req.query);
      const result = await this.notificationsService.getNotifications(req.user!.id, query);
      res.json(result);
    } catch (error) { next(error); }
  }

  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.notificationsService.markRead(req.user!.id, req.params.id as string);
      res.status(204).send();
    } catch (error) { next(error); }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.notificationsService.markAllRead(req.user!.id);
      res.status(204).send();
    } catch (error) { next(error); }
  }
}
