import type { WorkspaceRole } from '../contracts';
import type {
  BoardMember,
  BoardMemberRepository,
  WorkspaceMember,
  WorkspaceMemberRepository,
} from '../db';

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
  ...roles: WorkspaceRole[]
): Promise<WorkspaceMember> {
  return members.assertRole(userId, workspaceId, ...roles);
}

export function assertBoardMember(
  boardMembers: BoardMemberRepository,
  userId: string,
  boardId: string,
): Promise<BoardMember> {
  return boardMembers.assertMember(userId, boardId);
}

export function assertBoardWrite(
  boardMembers: BoardMemberRepository,
  userId: string,
  boardId: string,
): Promise<BoardMember> {
  return boardMembers.assertWrite(userId, boardId);
}
