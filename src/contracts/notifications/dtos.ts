export interface NotificationResponse {
  id: string;
  user_id: string;
  actor_id?: string;
  issue_id?: string;
  type: string;
  read: boolean;
  created_at: string;
}
