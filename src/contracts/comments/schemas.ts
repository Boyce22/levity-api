import { Type, type Static, type StaticDecode } from '@sinclair/typebox';
import { coerceNumberSchema, uuidSchema } from '../shared/typebox';

export const createCommentSchema = Type.Object({
  card_id: uuidSchema,
  content: Type.String({ minLength: 1, maxLength: 5000 }),
  parent_id: Type.Optional(Type.Union([uuidSchema, Type.Null()])),
});
export type CreateCommentInput = Static<typeof createCommentSchema>;

export const updateCommentSchema = Type.Object({
  content: Type.String({ minLength: 1, maxLength: 5000 }),
});
export type UpdateCommentInput = Static<typeof updateCommentSchema>;

export const queryCommentsSchema = Type.Object({
  card_id: uuidSchema,
  limit: coerceNumberSchema({ integer: true, positive: true, max: 50, defaultValue: 20 }),
  cursor: Type.Optional(Type.String()),
});
export type QueryCommentsInput = StaticDecode<typeof queryCommentsSchema>;
