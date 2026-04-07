import { z } from 'zod';
import { NotificationType } from '@/shared/enums/notification-type.enum';

export const queryNotificationsSchema = z.object({
  read: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
export type QueryNotificationsInput = z.infer<typeof queryNotificationsSchema>;

export const createNotificationSchema = z.object({
  user_id: z.uuid(),
  actor_id: z.uuid(),
  card_id: z.uuid(),
  type: z.nativeEnum(NotificationType),
  content: z.string().min(1).max(500),
});
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
