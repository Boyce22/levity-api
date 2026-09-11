export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export enum BoardRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export enum MembershipStatus {
  ACTIVE = 'ACTIVE',
  LEFT = 'LEFT',
  REMOVED = 'REMOVED',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum WorkspaceStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum CatalogStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export const WORKSPACE_MANAGE_ROLES: WorkspaceRole[] = [WorkspaceRole.OWNER, WorkspaceRole.ADMIN];
export const BOARD_WRITE_ROLES: BoardRole[] = [BoardRole.ADMIN, BoardRole.EDITOR];

export function canManageWorkspace(role: WorkspaceRole): boolean {
  return WORKSPACE_MANAGE_ROLES.includes(role);
}

export function canWriteBoard(role: BoardRole): boolean {
  return BOARD_WRITE_ROLES.includes(role);
}
