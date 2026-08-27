import type { Role } from '../shared/roles.enum';

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
  role: Role;
  joined_at: string;
  user?: { username: string; display_name?: string; avatar_url?: string };
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
  role: Role;
  created_at: string;
}

export interface WorkspaceTagResponse {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface WorkspacePriorityResponse {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  icon: string;
  position: number;
  created_at: string;
}

export interface BoardDataResponse {
  workspace: WorkspaceResponse;
  lists: ListWithCardsResponse[];
  members: WorkspaceMemberResponse[];
  tags: WorkspaceTagResponse[];
  priorities: WorkspacePriorityResponse[];
}

export interface ListWithCardsResponse {
  id: string;
  title: string;
  position: number;
  wip_limit?: number;
  list_type?: string;
  workspace_id: string;
  created_at: string;
  cards: CardResponse[];
}

export interface CardResponse {
  id: string;
  content: string;
  position: number;
  description?: string;
  cover_url?: string;
  assignee_id?: string;
  priority?: string;
  label?: string;
  progress?: number;
  due_date?: string;
  list_id: string;
  created_by: string;
  created_at: string;
  comment_count: number;
}
