import { Request, Response, NextFunction, Router } from 'express';
import { MembersService } from '../services/members.service';
import { authenticate } from '@/modules/auth/jwt.middleware';
import { validateDto } from '@utils';
import { updateMemberRoleSchema } from '../schemas';

export class MembersController {
  public router: Router;

  constructor(private readonly membersService: MembersService) {
    this.router = Router({ mergeParams: true });
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authenticate);
    this.router.get('/members', this.getMembers.bind(this));
    this.router.patch('/members/:memberId/role', this.updateRole.bind(this));
    this.router.delete('/members/:memberId', this.removeMember.bind(this));
  }

  async getMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.membersService.getMembers(req.user!.id, req.params.id as string);
      res.json(result);
    } catch (error) { next(error); }
  }

  async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = validateDto(updateMemberRoleSchema, req.body);
      const result = await this.membersService.updateMemberRole(req.user!.id, req.params.id as string, req.params.memberId as string, input);
      res.json(result);
    } catch (error) { next(error); }
  }

  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.membersService.removeMember(req.user!.id, req.params.id as string, req.params.memberId as string);
      res.status(204).send();
    } catch (error) { next(error); }
  }
}
