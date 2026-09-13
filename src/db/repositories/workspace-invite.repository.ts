import type { Repository } from 'typeorm';
import { type WorkspaceRole } from '../../contracts/index';
import { BadRequestError } from '../../shared/index';
import { type WorkspaceInvite } from '../entities/workspace-invite.entity';

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

  async create(
    workspaceId: string,
    createdBy: string,
    maxUses: number,
    workspaceRole: WorkspaceRole,
    expiresAt?: Date,
  ): Promise<WorkspaceInvite> {
    const invite = this.repository.create({
      workspace_id: workspaceId,
      created_by: createdBy,
      max_uses: maxUses,
      workspace_role: workspaceRole,
      expires_at: expiresAt,
    });
    return this.repository.save(invite);
  }

  async consume(token: string): Promise<WorkspaceInvite> {
    const result: unknown = await this.repository.query(
      `UPDATE workspace_invites SET current_uses = current_uses + 1
       WHERE token = $1
         AND revoked_at IS NULL
         AND current_uses < max_uses
         AND (expires_at IS NULL OR expires_at > now())
       RETURNING *`,
      [token],
    );
    const rows = returningRows<WorkspaceInvite>(result);
    const invite = rows[0];
    if (!invite) throw new BadRequestError('Invite is invalid, expired, or exhausted');
    return invite;
  }

  async revoke(id: string): Promise<void> {
    await this.repository.update(id, { revoked_at: new Date() });
  }
}

function returningRows<T>(result: unknown): T[] {
  if (Array.isArray(result) && Array.isArray(result[0])) {
    return result[0] as T[];
  }
  if (Array.isArray(result)) {
    return result as T[];
  }
  return [];
}
