import type { BoardColumnType } from '../shared/board-column-type.enum';

export interface IssueResponse {
  id: string;
  content: string;
  position: number;
  description?: string;
  cover_url?: string;
  assignee_id?: string;
  priority_id: string;
  tag_id?: string;
  progress?: number;
  due_date?: string;
  column_id: string;
  created_by: string;
  created_at: string;
  comment_count: number;
  story_points?: number;
  estimated_hours?: number;
}

export interface BoardColumnResponse {
  id: string;
  title: string;
  position: number;
  wip_limit?: number;
  column_type?: BoardColumnType;
  board_id: string;
  created_at: string;
  issues: IssueResponse[];
}

export interface BoardDataResponse {
  board: {
    id: string;
    workspace_id: string;
    name: string;
    position: number;
    created_at: string;
    updated_at: string;
  };
  columns: BoardColumnResponse[];
}

export interface IssueEventResponse {
  id: string;
  created_by: string;
  action_type: string;
  field: string;
  old_val?: string;
  new_val?: string;
  created_at: string;
  users?: {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}
