import { Type, type Static } from '@sinclair/typebox';
import { emailSchema, uuidSchema } from '../shared/typebox';

export const updateUserSchema = Type.Object({
  display_name: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
  avatar_url: Type.Optional(Type.String()),
  bio: Type.Optional(Type.String({ maxLength: 500 })),
  email: Type.Optional(emailSchema),
});

export type UpdateUserInput = Static<typeof updateUserSchema>;

export const queryUsersSchema = Type.Object({
  workspace_id: Type.Optional(uuidSchema),
  search: Type.Optional(Type.String()),
});

export type QueryUsersInput = Static<typeof queryUsersSchema>;
