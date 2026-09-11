import { type Repository } from 'typeorm';
import { MembershipStatus, type WorkspaceRole } from '../../contracts/index';
import { NotFoundError, ForbiddenError } from '../../shared/index';
import { type WorkspaceMember } from '../entities/workspace-member.entity';

export class WorkspaceMemberRepository {
  constructor(private readonly repository: Repository<WorkspaceMember>) {}

  async findByWorkspace(workspaceId: string): Promise<WorkspaceMember[]> {
    return this.repository.find({ where: { workspace_id: workspaceId } });
  }

  async findByUserAndWorkspace(userId: string, workspaceId: string): Promise<WorkspaceMember | null> {
    const active = await this.repository.findOne({
      where: { user_id: userId, workspace_id: workspaceId, membership_status: MembershipStatus.ACTIVE },
    });
    if (active) return active;
    return this.repository.findOne({ where: { user_id: userId, workspace_id: workspaceId } });
  }

  async assertMember(userId: string, workspaceId: string): Promise<WorkspaceMember> {
    const member = await this.repository
      .createQueryBuilder('wm')
      .innerJoin('workspaces', 'w', 'w.id = wm.workspace_id')
      .where('wm.user_id = :userId', { userId })
      .andWhere('wm.workspace_id = :workspaceId', { workspaceId })
      .andWhere('wm.membership_status = :status', { status: MembershipStatus.ACTIVE })
      .andWhere('w.deleted_at IS NULL')
      .getOne();
    if (!member) throw new ForbiddenError('Not a member of this workspace');
    return member;
  }

  async assertRole(userId: string, workspaceId: string, ...allowedRoles: WorkspaceRole[]): Promise<WorkspaceMember> {
    const member = await this.assertMember(userId, workspaceId);
    if (!allowedRoles.includes(member.role)) throw new ForbiddenError('Insufficient permissions');
    return member;
  }

  async add(workspaceId: string, userId: string, role: WorkspaceRole): Promise<WorkspaceMember> {
    const member = this.repository.create({
      workspace_id: workspaceId,
      user_id: userId,
      role,
      membership_status: MembershipStatus.ACTIVE,
    });
    return this.repository.save(member);
  }

  async upsertActive(workspaceId: string, userId: string, role: WorkspaceRole): Promise<WorkspaceMember> {
    const existing = await this.repository.findOne({ where: { user_id: userId, workspace_id: workspaceId } });
    if (existing) {
      existing.role = role;
      existing.membership_status = MembershipStatus.ACTIVE;
      existing.left_at = null;
      return this.repository.save(existing);
    }
    return this.add(workspaceId, userId, role);
  }

  async updateRole(workspaceId: string, userId: string, role: WorkspaceRole): Promise<WorkspaceMember> {
    const member = await this.findByUserAndWorkspace(userId, workspaceId);
    if (!member) throw new NotFoundError('Member not found');
    member.role = role;
    return this.repository.save(member);
  }

  async remove(
    workspaceId: string,
    userId: string,
    status: MembershipStatus.LEFT | MembershipStatus.REMOVED = MembershipStatus.REMOVED,
  ): Promise<void> {
    const member = await this.findByUserAndWorkspace(userId, workspaceId);
    if (!member) throw new NotFoundError('Member not found');
    member.membership_status = status;
    member.left_at = new Date();
    await this.repository.save(member);
  }
}
