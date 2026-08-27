import { z } from 'zod';
import { NotificationType } from '../shared/notification-type.enum';

const booleanQuerySchema = z.preprocess((value) => {
  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  return value;
}, z.boolean());

export const queryNotificationsSchema = z.object({
  read: booleanQuerySchema.optional(),
  cursor: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
export type QueryNotificationsInput = z.infer<typeof queryNotificationsSchema>;

export const createNotificationSchema = z.object({
  user_id: z.uuid(),
  actor_id: z.uuid(),
  card_id: z.uuid(),
  type: z.enum(NotificationType),
  content: z.string().min(1).max(500),
});
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
