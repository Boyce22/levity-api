export enum WorkspaceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum BoardRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export enum MembershipStatus {
  ACTIVE = 'active',
  LEFT = 'left',
  REMOVED = 'removed',
}

export enum AccountStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export enum WorkspaceStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export enum CatalogStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export const WORKSPACE_MANAGE_ROLES: WorkspaceRole[] = [WorkspaceRole.OWNER, WorkspaceRole.ADMIN];
export const BOARD_WRITE_ROLES: BoardRole[] = [BoardRole.ADMIN, BoardRole.EDITOR];

export function canManageWorkspace(role: WorkspaceRole): boolean {
  return WORKSPACE_MANAGE_ROLES.includes(role);
}

export function canWriteBoard(role: BoardRole): boolean {
  return BOARD_WRITE_ROLES.includes(role);
}
