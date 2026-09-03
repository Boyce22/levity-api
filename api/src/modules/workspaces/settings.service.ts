import type { Logger } from 'pino';
import {
  Role,
  type CreateTagInput,
  type CreatePriorityInput,
  type WorkspaceTagResponse,
  type WorkspacePriorityResponse,
} from '../../domain/index';
import type {
  WorkspaceTag,
  WorkspacePriority,
  WorkspaceTagRepository,
  WorkspacePriorityRepository,
  WorkspaceMemberRepository,
} from '../../db/index';

export class SettingsService {
  constructor(
    private readonly tagRepository: WorkspaceTagRepository,
    private readonly priorityRepository: WorkspacePriorityRepository,
    private readonly memberRepository: WorkspaceMemberRepository,
    private readonly logger: Logger,
  ) {}

  async getTags(userId: string, workspaceId: string): Promise<WorkspaceTagResponse[]> {
    await this.memberRepository.assertMember(userId, workspaceId);
    const tags = await this.tagRepository.findByWorkspace(workspaceId);
    return tags.map(toTagResponse);
  }

  async createTag(userId: string, workspaceId: string, input: CreateTagInput): Promise<WorkspaceTagResponse> {
    await this.memberRepository.assertRole(userId, workspaceId, Role.OWNER, Role.ADMIN);
    const tag = await this.tagRepository.create(workspaceId, input.name, input.color);
    this.logger.info({ workspaceId, tagId: tag.id }, 'Tag created');
    return toTagResponse(tag);
  }

  async deleteTag(userId: string, workspaceId: string, tagId: string): Promise<void> {
    await this.memberRepository.assertRole(userId, workspaceId, Role.OWNER, Role.ADMIN);
    await this.tagRepository.delete(tagId);
  }

  async getPriorities(userId: string, workspaceId: string): Promise<WorkspacePriorityResponse[]> {
    await this.memberRepository.assertMember(userId, workspaceId);
    const priorities = await this.priorityRepository.findByWorkspace(workspaceId);
    return priorities.map(toPriorityResponse);
  }

  async createPriority(
    userId: string,
    workspaceId: string,
    input: CreatePriorityInput,
  ): Promise<WorkspacePriorityResponse> {
    await this.memberRepository.assertRole(userId, workspaceId, Role.OWNER, Role.ADMIN);
    const priority = await this.priorityRepository.create(workspaceId, input);
    return toPriorityResponse(priority);
  }

  async deletePriority(userId: string, workspaceId: string, priorityId: string): Promise<void> {
    await this.memberRepository.assertRole(userId, workspaceId, Role.OWNER, Role.ADMIN);
    await this.priorityRepository.delete(priorityId);
  }
}

function toTagResponse(t: WorkspaceTag): WorkspaceTagResponse {
  return {
    id: t.id,
    workspace_id: t.workspace_id,
    name: t.name,
    color: t.color,
    created_at: t.created_at.toISOString(),
  };
}

function toPriorityResponse(p: WorkspacePriority): WorkspacePriorityResponse {
  return {
    id: p.id,
    workspace_id: p.workspace_id,
    name: p.name,
    color: p.color,
    icon: p.icon,
    position: p.position,
    created_at: p.created_at.toISOString(),
  };
}
