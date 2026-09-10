import { Type, type Static, type StaticDecode } from '@sinclair/typebox';
import { NotificationType } from '../shared/notification-type.enum';
import { booleanQuerySchema, coerceNumberSchema, dateTimeSchema, uuidSchema } from '../shared/typebox';

export const queryNotificationsSchema = Type.Object({
  read: Type.Optional(booleanQuerySchema),
  cursor: Type.Optional(dateTimeSchema),
  page: coerceNumberSchema({ integer: true, positive: true, defaultValue: 1 }),
  limit: coerceNumberSchema({ integer: true, positive: true, max: 50, defaultValue: 20 }),
});
export type QueryNotificationsInput = StaticDecode<typeof queryNotificationsSchema>;

export const createNotificationSchema = Type.Object({
  user_id: uuidSchema,
  actor_id: Type.Optional(uuidSchema),
  issue_id: Type.Optional(uuidSchema),
  type: Type.Enum(NotificationType),
});
export type CreateNotificationInput = Static<typeof createNotificationSchema>;
