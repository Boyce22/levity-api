import type { BoardRole, CatalogStatus, MembershipStatus, WorkspaceRole, WorkspaceStatus } from '../shared/roles.enum';
import type { UserSummary } from '../users/dtos';

export interface WorkspaceResponse {
  id: string;
  name: string;
  status: WorkspaceStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMemberResponse {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  membership_status: MembershipStatus;
  joined_at: string;
  left_at?: string;
  last_accessed_at?: string;
  user?: Omit<UserSummary, 'id'> & { username: string };
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
  grants: InviteBoardGrantResponse[];
}

export interface WorkspaceTagResponse {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  status: CatalogStatus;
  created_at: string;
  updated_at: string;
}

export interface WorkspacePriorityResponse {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  icon: string;
  position: number;
  code?: string | null;
  is_system: boolean;
  status: CatalogStatus;
  created_at: string;
  updated_at: string;
}

export interface BoardSummaryResponse {
  id: string;
  workspace_id: string;
  name: string;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface HomeBoardResponse {
  id: string;
  workspace_id: string;
  name: string;
  position: number;
  role: BoardRole;
}

export interface BoardMemberResponse {
  id: string;
  board_id: string;
  user_id: string;
  role: BoardRole;
  membership_status: MembershipStatus;
  joined_at: string;
  left_at?: string;
  last_accessed_at?: string;
  user?: Omit<UserSummary, 'id'>;
}
