import { Type, type Static } from '@sinclair/typebox';
import { NotificationType } from '../shared/notification-type.enum';
import { dateTimeSchema, uuidSchema } from '../shared/typebox';

export const queryNotificationsSchema = Type.Object({
  read: Type.Optional(Type.Boolean()),
  cursor: Type.Optional(dateTimeSchema),
  page: Type.Integer({ minimum: 1, default: 1 }),
  limit: Type.Integer({ minimum: 1, maximum: 50, default: 20 }),
});
export type QueryNotificationsInput = Static<typeof queryNotificationsSchema>;

export const createNotificationSchema = Type.Object({
  user_id: uuidSchema,
  actor_id: Type.Optional(uuidSchema),
  issue_id: Type.Optional(uuidSchema),
  type: Type.Enum(NotificationType),
});
export type CreateNotificationInput = Static<typeof createNotificationSchema>;
