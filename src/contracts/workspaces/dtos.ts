import type { BoardRole, CatalogStatus, MembershipStatus, WorkspaceRole } from '../shared/roles.enum';

export interface WorkspaceResponse {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMemberResponse {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
  membership_status?: MembershipStatus;
  user?: { username: string; first_name?: string; last_name?: string; avatar_url?: string };
}

export interface InviteBoardGrantResponse {
  board_id: string;
  board_role: BoardRole;
}

export interface WorkspaceInviteResponse {
  id: string;
  workspace_id: string;
  token: string;
  created_by: string;
  max_uses: number;
  current_uses: number;
  expires_at?: string;
  revoked_at?: string;
  workspace_role: WorkspaceRole;
  created_at: string;
  grants?: InviteBoardGrantResponse[];
}

export interface WorkspaceTagResponse {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  created_at: string;
  status?: CatalogStatus;
}

export interface WorkspacePriorityResponse {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  icon: string;
  position: number;
  created_at: string;
  code?: string | null;
  is_system: boolean;
  status: CatalogStatus;
}

export interface HomeBoardResponse {
  id: string;
  name: string;
  position: number;
  role: BoardRole;
}
