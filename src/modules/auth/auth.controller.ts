import { z } from 'zod';
import { Request, Response, NextFunction, Router } from 'express';
import { AuthService } from './auth.service';
import { validateDto } from '@utils';

const loginSchema = z.object({
  userName: z.string().min(3),
  password: z.string().min(5),
});

const registerSchema = z.object({
  userName: z.string().min(3).max(30),
  password: z.string().min(5),
  email: z.email().optional(),
});

export class AuthController {
  public router: Router;

  constructor(private readonly authService: AuthService) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/login', this.login.bind(this));
    this.router.post('/register', this.register.bind(this));
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userName, password } = validateDto(loginSchema, req.body);
      const result = await this.authService.login(userName, password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userName, password, email } = validateDto(registerSchema, req.body);
      const result = await this.authService.register(userName, password, email);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}
