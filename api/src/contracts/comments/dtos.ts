export interface CommentResponse {
  id: string;
  card_id: string;
  created_by: string;
  parent_id?: string | null;
  content: string;
  created_at: string;
  user?: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  replies?: CommentResponse[];
}
