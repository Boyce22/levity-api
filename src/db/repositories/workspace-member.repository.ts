import type { Repository } from 'typeorm';
import { type Role } from '../../contracts/index';
import { NotFoundError, ForbiddenError } from '../../shared/index';
import { type WorkspaceMember } from '../entities/workspace-member.entity';

export class WorkspaceMemberRepository {
  constructor(private readonly repository: Repository<WorkspaceMember>) {}

  async findByWorkspace(workspaceId: string): Promise<WorkspaceMember[]> {
    return this.repository.find({ where: { workspace_id: workspaceId } });
  }

  async findByUserAndWorkspace(userId: string, workspaceId: string): Promise<WorkspaceMember | null> {
    return this.repository.findOne({ where: { user_id: userId, workspace_id: workspaceId } });
  }

  async assertMember(userId: string, workspaceId: string): Promise<WorkspaceMember> {
    const member = await this.findByUserAndWorkspace(userId, workspaceId);
    if (!member) throw new ForbiddenError('Not a member of this workspace');
    return member;
  }

  async assertRole(userId: string, workspaceId: string, ...allowedRoles: Role[]): Promise<WorkspaceMember> {
    const member = await this.assertMember(userId, workspaceId);
    if (!allowedRoles.includes(member.role)) throw new ForbiddenError('Insufficient permissions');
    return member;
  }

  async add(workspaceId: string, userId: string, role: Role): Promise<WorkspaceMember> {
    const member = this.repository.create({ workspace_id: workspaceId, user_id: userId, role });
    return this.repository.save(member);
  }

  async updateRole(workspaceId: string, userId: string, role: Role): Promise<WorkspaceMember> {
    const member = await this.findByUserAndWorkspace(userId, workspaceId);
    if (!member) throw new NotFoundError('Member not found');
    member.role = role;
    return this.repository.save(member);
  }

  async remove(workspaceId: string, userId: string): Promise<void> {
    const result = await this.repository.delete({ user_id: userId, workspace_id: workspaceId });
    if (!result.affected) throw new NotFoundError('Member not found');
  }
}
