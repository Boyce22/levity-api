import { Type, type Static } from '@sinclair/typebox';
import { uuidSchema } from '../shared/typebox';

export const createCommentSchema = Type.Object({
  issue_id: uuidSchema,
  content: Type.String({ minLength: 1, maxLength: 5000 }),
  parent_id: Type.Optional(Type.Union([uuidSchema, Type.Null()])),
});
export type CreateCommentInput = Static<typeof createCommentSchema>;

export const updateCommentSchema = Type.Object({
  content: Type.String({ minLength: 1, maxLength: 5000 }),
});
export type UpdateCommentInput = Static<typeof updateCommentSchema>;

export const queryCommentsSchema = Type.Object({
  issue_id: uuidSchema,
  limit: Type.Integer({ minimum: 1, maximum: 50, default: 20 }),
  cursor: Type.Optional(Type.String()),
});
export type QueryCommentsInput = Static<typeof queryCommentsSchema>;
