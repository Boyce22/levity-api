export interface CommentResponse {
  id: string;
  issue_id: string;
  created_by: string;
  parent_id?: string | null;
  content: string;
  created_at: string;
  user?: {
    username: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  replies?: CommentResponse[];
}
