import { Request, Response, NextFunction, Router } from 'express';
import { WorkspaceService } from '../services/workspace.service';
import { MembersService } from '../services/members.service';
import { authenticate } from '@/modules/auth/jwt.middleware';
import { validateDto } from '@utils';
import { createWorkspaceSchema, renameWorkspaceSchema, generateInviteSchema } from '../schemas';

export class WorkspaceController {
  public router: Router;

  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly membersService: MembersService,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authenticate);
    this.router.get('/', this.getWorkspaces.bind(this));
    this.router.post('/', this.create.bind(this));
    this.router.patch('/:id', this.rename.bind(this));
    this.router.delete('/:id', this.delete.bind(this));
    this.router.get('/:id/invites', this.getInvites.bind(this));
    this.router.post('/:id/invites', this.generateInvite.bind(this));
    this.router.get('/:id/invites/:token', this.getInviteDetails.bind(this));
    this.router.post('/:id/invites/:token/accept', this.acceptInvite.bind(this));
    this.router.delete('/:id/invites/:inviteId', this.revokeInvite.bind(this));
  }

  async getWorkspaces(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.workspaceService.getWorkspaces(req.user!.id);
      res.json(result);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = validateDto(createWorkspaceSchema, req.body);
      const result = await this.workspaceService.create(req.user!.id, name);
      res.status(201).json(result);
    } catch (error) { next(error); }
  }

  async rename(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = validateDto(renameWorkspaceSchema, req.body);
      const result = await this.workspaceService.rename(req.user!.id, req.params.id as string, name);
      res.json(result);
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.workspaceService.delete(req.user!.id, req.params.id as string);
      res.status(204).send();
    } catch (error) { next(error); }
  }

  async getInvites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.workspaceService.getInvites(req.user!.id, req.params.id as string);
      res.json(result);
    } catch (error) { next(error); }
  }

  async generateInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = validateDto(generateInviteSchema, req.body);
      const result = await this.membersService.generateInvite(req.user!.id, req.params.id as string, input);
      res.status(201).json(result);
    } catch (error) { next(error); }
  }

  async getInviteDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.membersService.getInviteDetails(req.params.token as string);
      res.json(result);
    } catch (error) { next(error); }
  }

  async acceptInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.membersService.acceptInvite(req.user!.id, req.params.token as string);
      res.json(result);
    } catch (error) { next(error); }
  }

  async revokeInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.membersService.revokeInvite(req.user!.id, req.params.id as string, req.params.inviteId as string);
      res.status(204).send();
    } catch (error) { next(error); }
  }
}
