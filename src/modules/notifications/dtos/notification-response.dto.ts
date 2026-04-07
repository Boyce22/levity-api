export interface NotificationResponse {
  id: string;
  user_id: string;
  actor_id: string;
  card_id: string;
  type: string;
  content: string;
  read: boolean;
  created_at: string;
}
