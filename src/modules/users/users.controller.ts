import { Request, Response, NextFunction, Router } from 'express';
import { UsersService } from './users.service';
import { authenticate } from '@/modules/auth/jwt.middleware';
import { validateDto } from '@utils';
import { updateUserSchema, queryUsersSchema } from './schemas';

export class UsersController {
  public router: Router;

  constructor(private readonly usersService: UsersService) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/me', authenticate, this.getProfile.bind(this));
    this.router.patch('/me', authenticate, this.updateProfile.bind(this));
    this.router.get('/', authenticate, this.getUsersByWorkspace.bind(this));
  }

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.usersService.getProfile(req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = validateDto(updateUserSchema, req.body);
      const result = await this.usersService.updateProfile(req.user!.id, input);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getUsersByWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workspace_id } = validateDto(queryUsersSchema, req.query);
      if (!workspace_id) { res.json([]); return; }
      const result = await this.usersService.getUsersByWorkspace(workspace_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
