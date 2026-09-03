import type { Role } from '@levity/domain';
import type { WorkspaceMember, WorkspaceMemberRepository } from '@levity/persistence';

export function assertMember(
  members: WorkspaceMemberRepository,
  userId: string,
  workspaceId: string,
): Promise<WorkspaceMember> {
  return members.assertMember(userId, workspaceId);
}

export function assertRole(
  members: WorkspaceMemberRepository,
  userId: string,
  workspaceId: string,
  ...roles: Role[]
): Promise<WorkspaceMember> {
  return members.assertRole(userId, workspaceId, ...roles);
}
