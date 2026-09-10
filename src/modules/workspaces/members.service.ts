import type { Logger } from 'pino';
import {
  WorkspaceRole,
  type GenerateInviteInput,
  type UpdateMemberRoleInput,
  type WorkspaceInviteResponse,
  type WorkspaceMemberResponse,
} from '../../contracts/index';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/index';
import {
  BoardMember,
  BoardMemberRepository,
  InviteBoardGrant,
  InviteBoardGrantRepository,
  WorkspaceInvite,
  WorkspaceInviteRepository,
  WorkspaceMember,
  WorkspaceMemberRepository,
  type TransactionManager,
} from '../../db/index';

export class MembersService {
  constructor(
    private readonly memberRepository: WorkspaceMemberRepository,
    private readonly inviteRepository: WorkspaceInviteRepository,
    private readonly grantRepository: InviteBoardGrantRepository,
    private readonly boardMemberRepository: BoardMemberRepository,
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
    await this.memberRepository.assertRole(userId, workspaceId, WorkspaceRole.OWNER, WorkspaceRole.ADMIN);

    if (!input.board_grants?.length) {
      throw new BadRequestError('board_grants is required');
    }

    const expiresAt = input.expires_in_hours
      ? new Date(Date.now() + input.expires_in_hours * 3600 * 1000)
      : undefined;

    const { invite, grants } = await this.transactionManager.runInTransaction(async (manager) => {
      const inviteRepository = new WorkspaceInviteRepository(manager.getRepository(WorkspaceInvite));
      const grantRepository = new InviteBoardGrantRepository(manager.getRepository(InviteBoardGrant));

      const created = await inviteRepository.create(
        workspaceId,
        userId,
        input.max_uses,
        input.workspace_role ?? WorkspaceRole.MEMBER,
        expiresAt,
      );
      const createdGrants = await grantRepository.createMany(created.id, input.board_grants);
      return { invite: created, grants: createdGrants };
    });

    return toInviteResponse(invite, grants);
  }

  async getInviteDetails(token: string): Promise<WorkspaceInviteResponse> {
    const invite = await this.inviteRepository.findByToken(token);
    if (!invite) throw new NotFoundError('Invite not found');
    const grants = await this.grantRepository.findByInvite(invite.id);
    return toInviteResponse(invite, grants);
  }

  async acceptInvite(userId: string, token: string): Promise<WorkspaceMemberResponse> {
    const member = await this.transactionManager.runInTransaction(async (manager) => {
      const inviteRepository = new WorkspaceInviteRepository(manager.getRepository(WorkspaceInvite));
      const memberRepository = new WorkspaceMemberRepository(manager.getRepository(WorkspaceMember));
      const grantRepository = new InviteBoardGrantRepository(manager.getRepository(InviteBoardGrant));
      const boardMemberRepository = new BoardMemberRepository(manager.getRepository(BoardMember));

      const invite = await inviteRepository.consume(token);
      const workspaceMember = await memberRepository.upsertActive(
        invite.workspace_id,
        userId,
        invite.workspace_role,
      );

      const grants = await grantRepository.findByInvite(invite.id);
      if (!grants.length) throw new BadRequestError('Invite has no board grants');

      for (const grant of grants) {
        await boardMemberRepository.upsertActive(grant.board_id, userId, grant.board_role);
      }

      return workspaceMember;
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
    await this.memberRepository.assertRole(actorId, workspaceId, WorkspaceRole.OWNER, WorkspaceRole.ADMIN);
    const member = await this.memberRepository.updateRole(workspaceId, memberId, input.role);
    return toMemberResponse(member);
  }

  async revokeInvite(userId: string, workspaceId: string, inviteId: string): Promise<void> {
    await this.memberRepository.assertRole(userId, workspaceId, WorkspaceRole.OWNER, WorkspaceRole.ADMIN);
    const invite = await this.inviteRepository.findById(inviteId);
    if (!invite || invite.workspace_id !== workspaceId) throw new NotFoundError('Invite not found');
    if (invite.revoked_at) throw new ConflictError('Invite already revoked');
    await this.inviteRepository.revoke(inviteId);
    this.logger.info({ userId, workspaceId, inviteId }, 'Invite revoked');
  }

  async removeMember(actorId: string, workspaceId: string, memberId: string): Promise<void> {
    await this.memberRepository.assertRole(actorId, workspaceId, WorkspaceRole.OWNER, WorkspaceRole.ADMIN);
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
    membership_status: m.membership_status,
    user: m.user
      ? {
          username: m.user.username,
          first_name: m.user.first_name ?? undefined,
          last_name: m.user.last_name ?? undefined,
          avatar_url: m.user.avatar_url ?? undefined,
        }
      : undefined,
  };
}

function toInviteResponse(i: WorkspaceInvite, grants: InviteBoardGrant[] = []): WorkspaceInviteResponse {
  return {
    id: i.id,
    workspace_id: i.workspace_id,
    token: i.token,
    created_by: i.created_by,
    max_uses: i.max_uses,
    current_uses: i.current_uses,
    expires_at: i.expires_at?.toISOString(),
    revoked_at: i.revoked_at?.toISOString(),
    workspace_role: i.workspace_role,
    created_at: i.created_at.toISOString(),
    grants: grants.map((g) => ({ board_id: g.board_id, board_role: g.board_role })),
  };
}
