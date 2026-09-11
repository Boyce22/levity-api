import type { UserSummary } from '../users/dtos';

export interface CommentResponse {
  id: string;
  issue_id: string;
  created_by: string;
  parent_id?: string | null;
  content: string;
  created_at: string;
  user?: Omit<UserSummary, 'id'>;
  replies?: CommentResponse[];
}
