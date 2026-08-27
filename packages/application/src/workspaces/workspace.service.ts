import type { Logger } from 'pino';
import { Role, type WorkspaceResponse, type WorkspaceInviteResponse } from '@levity/domain';
import type { Workspace, WorkspaceInvite, WorkspaceRepository, WorkspaceMemberRepository, WorkspaceInviteRepository } from '@levity/persistence';

export class WorkspaceService {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly memberRepository: WorkspaceMemberRepository,
    private readonly inviteRepository: WorkspaceInviteRepository,
    private readonly logger: Logger,
  ) {}

  async getWorkspaces(userId: string): Promise<WorkspaceResponse[]> {
    const workspaces = await this.workspaceRepository.findByUser(userId);
    return workspaces.map(toWorkspaceResponse);
  }

  async create(userId: string, name: string): Promise<WorkspaceResponse> {
    const workspace = await this.workspaceRepository.create(name, userId);
    await this.memberRepository.add(workspace.id, userId, Role.OWNER);
    this.logger.info({ workspaceId: workspace.id, userId }, 'Workspace created');
    return toWorkspaceResponse(workspace);
  }

  async rename(userId: string, workspaceId: string, name: string): Promise<WorkspaceResponse> {
    await this.memberRepository.assertRole(userId, workspaceId, Role.OWNER, Role.ADMIN);
    const workspace = await this.workspaceRepository.rename(workspaceId, name);
    return toWorkspaceResponse(workspace);
  }

  async delete(userId: string, workspaceId: string): Promise<void> {
    await this.memberRepository.assertRole(userId, workspaceId, Role.OWNER);
    await this.workspaceRepository.delete(workspaceId);
    this.logger.info({ workspaceId, userId }, 'Workspace deleted');
  }

  async getInvites(userId: string, workspaceId: string): Promise<WorkspaceInviteResponse[]> {
    await this.memberRepository.assertRole(userId, workspaceId, Role.OWNER, Role.ADMIN);
    const invites = await this.inviteRepository.findByWorkspace(workspaceId);
    return invites.map(toInviteResponse);
  }
}

function toWorkspaceResponse(ws: Workspace): WorkspaceResponse {
  return {
    id: ws.id,
    name: ws.name,
    created_by: ws.created_by,
    created_at: ws.created_at.toISOString(),
    updated_at: ws.updated_at.toISOString(),
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
    role: i.role,
    created_at: i.created_at.toISOString(),
  };
}
