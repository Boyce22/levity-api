import type { NotificationType } from '../shared/notification-type.enum';

export interface NotificationResponse {
  id: string;
  user_id: string;
  actor_id?: string;
  issue_id?: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
}
