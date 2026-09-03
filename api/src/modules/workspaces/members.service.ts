import type { Logger } from 'pino';
import {
  Role,
  type GenerateInviteInput,
  type UpdateMemberRoleInput,
  type WorkspaceMemberResponse,
  type WorkspaceInviteResponse,
} from '../../contracts/index';
import { ConflictError, NotFoundError } from '../../shared/index';
import {
  WorkspaceMember,
  WorkspaceInvite,
  WorkspaceMemberRepository,
  WorkspaceInviteRepository,
  type TransactionManager,
} from '../../db/index';

export class MembersService {
  constructor(
    private readonly memberRepository: WorkspaceMemberRepository,
    private readonly inviteRepository: WorkspaceInviteRepository,
    private readonly transactionManager: TransactionManager,
    private readonly logger: Logger,
  ) {}

  async getMembers(userId: string, workspaceId: string): Promise<WorkspaceMemberResponse[]> {
    await this.memberRepository.assertMember(userId, workspaceId);
    const members = await this.memberRepository.findByWorkspace(workspaceId);
    return members.map(toMemberResponse);
  }

  async generateInvite(
    userId: string,
    workspaceId: string,
    input: GenerateInviteInput,
  ): Promise<WorkspaceInviteResponse> {
    await this.memberRepository.assertRole(userId, workspaceId, Role.OWNER, Role.ADMIN);

    const expiresAt = input.expires_in_hours
      ? new Date(Date.now() + input.expires_in_hours * 3600 * 1000)
      : undefined;

    const invite = await this.inviteRepository.create(
      workspaceId,
      userId,
      input.max_uses,
      input.role,
      expiresAt,
    );
    return toInviteResponse(invite);
  }

  async getInviteDetails(token: string): Promise<WorkspaceInviteResponse> {
    const invite = await this.inviteRepository.findByToken(token);
    if (!invite) throw new NotFoundError('Invite not found');
    return toInviteResponse(invite);
  }

  async acceptInvite(userId: string, token: string): Promise<WorkspaceMemberResponse> {
    const member = await this.transactionManager.runInTransaction(async (manager) => {
      const inviteRepository = new WorkspaceInviteRepository(manager.getRepository(WorkspaceInvite));
      const memberRepository = new WorkspaceMemberRepository(manager.getRepository(WorkspaceMember));
      const invite = await inviteRepository.consume(token);

      const existing = await memberRepository.findByUserAndWorkspace(userId, invite.workspace_id);
      if (existing) throw new ConflictError('Already a member of this workspace');

      return memberRepository.add(invite.workspace_id, userId, invite.role);
    });

    this.logger.info({ userId, workspaceId: member.workspace_id }, 'User joined workspace');
    return toMemberResponse(member);
  }

  async updateMemberRole(
    actorId: string,
    workspaceId: string,
    memberId: string,
    input: UpdateMemberRoleInput,
  ): Promise<WorkspaceMemberResponse> {
    await this.memberRepository.assertRole(actorId, workspaceId, Role.OWNER, Role.ADMIN);
    const member = await this.memberRepository.updateRole(workspaceId, memberId, input.role);
    return toMemberResponse(member);
  }

  async revokeInvite(userId: string, workspaceId: string, inviteId: string): Promise<void> {
    await this.memberRepository.assertRole(userId, workspaceId, Role.OWNER, Role.ADMIN);
    const invite = await this.inviteRepository.findById(inviteId);
    if (!invite || invite.workspace_id !== workspaceId) throw new NotFoundError('Invite not found');
    if (invite.revoked_at) throw new ConflictError('Invite already revoked');
    await this.inviteRepository.revoke(inviteId);
    this.logger.info({ userId, workspaceId, inviteId }, 'Invite revoked');
  }

  async removeMember(actorId: string, workspaceId: string, memberId: string): Promise<void> {
    await this.memberRepository.assertRole(actorId, workspaceId, Role.OWNER, Role.ADMIN);
    await this.memberRepository.remove(workspaceId, memberId);
    this.logger.info({ actorId, workspaceId, memberId }, 'Member removed');
  }
}

function toMemberResponse(m: WorkspaceMember): WorkspaceMemberResponse {
  return {
    id: m.id,
    workspace_id: m.workspace_id,
    user_id: m.user_id,
    role: m.role,
    joined_at: m.joined_at.toISOString(),
  };
}

function toInviteResponse(i: WorkspaceInvite): WorkspaceInviteResponse {
  return {
    id: i.id,
    workspace_id: i.workspace_id,
    token: i.token,
    created_by: i.created_by,
    max_uses: i.max_uses,
    current_uses: i.current_uses,
    expires_at: i.expires_at?.toISOString(),
    revoked_at: i.revoked_at?.toISOString(),
    role: i.role,
    created_at: i.created_at.toISOString(),
  };
}
