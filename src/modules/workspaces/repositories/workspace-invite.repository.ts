import { Repository } from 'typeorm';
import { WorkspaceInvite } from '../entities/workspace-invite.entity';
import { Role } from '@/shared/enums/roles.enum';
import { NotFoundError, BadRequestError } from '@errors';

export class WorkspaceInviteRepository {
  constructor(private readonly repository: Repository<WorkspaceInvite>) {}

  async findById(id: string): Promise<WorkspaceInvite | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByToken(token: string): Promise<WorkspaceInvite | null> {
    return this.repository.findOne({ where: { token }, relations: ['workspace'] });
  }

  async findByWorkspace(workspaceId: string): Promise<WorkspaceInvite[]> {
    return this.repository.find({ where: { workspace_id: workspaceId } });
  }

  async create(workspaceId: string, createdBy: string, maxUses: number, role: Role, expiresAt?: Date): Promise<WorkspaceInvite> {
    const invite = this.repository.create({
      workspace_id: workspaceId,
      created_by: createdBy,
      max_uses: maxUses,
      role,
      expires_at: expiresAt,
    });
    return this.repository.save(invite);
  }

  async consume(token: string): Promise<WorkspaceInvite> {
    const invite = await this.findByToken(token);
    if (!invite) throw new NotFoundError('Invite not found');
    if (invite.revoked_at) throw new BadRequestError('Invite has been revoked');
    if (invite.expires_at && new Date() > invite.expires_at) throw new BadRequestError('Invite has expired');
    if (invite.current_uses >= invite.max_uses) throw new BadRequestError('Invite has reached its maximum uses');

    invite.current_uses += 1;
    return this.repository.save(invite);
  }

  async revoke(id: string): Promise<void> {
    await this.repository.update(id, { revoked_at: new Date() });
  }
}
