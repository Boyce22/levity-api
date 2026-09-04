import { Type, type Static } from '@sinclair/typebox';
import { ListType } from '../shared/list-type.enum';
import { uuidSchema } from '../shared/typebox';

export const createListSchema = Type.Object({
  title: Type.String({ minLength: 1, maxLength: 100 }),
  position: Type.Number({ default: 0 }),
});
export type CreateListInput = Static<typeof createListSchema>;

export const updateListSchema = Type.Object({
  title: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  position: Type.Optional(Type.Number()),
  wip_limit: Type.Optional(Type.Union([Type.Integer({ exclusiveMinimum: 0 }), Type.Null()])),
  list_type: Type.Optional(Type.Union([Type.Enum(ListType), Type.Null()])),
});
export type UpdateListInput = Static<typeof updateListSchema>;

export const updateListPositionsSchema = Type.Array(
  Type.Object({ id: uuidSchema, position: Type.Number() }),
);
export type UpdateListPositionsInput = Static<typeof updateListPositionsSchema>;

export const createCardSchema = Type.Object({
  content: Type.String({ minLength: 1, maxLength: 500 }),
  list_id: uuidSchema,
  position: Type.Number({ default: 0 }),
});
export type CreateCardInput = Static<typeof createCardSchema>;

export const updateCardSchema = Type.Object({
  content: Type.Optional(Type.String({ minLength: 1, maxLength: 500 })),
  description: Type.Optional(Type.Union([Type.String({ maxLength: 10000 }), Type.Null()])),
  cover_url: Type.Optional(Type.Union([Type.String({ maxLength: 2048 }), Type.Null()])),
  assignee_id: Type.Optional(Type.Union([uuidSchema, Type.Null()])),
  priority: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  label: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  progress: Type.Optional(Type.Union([Type.Integer({ minimum: 0, maximum: 100 }), Type.Null()])),
  due_date: Type.Optional(Type.Union([Type.String({ pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.source }), Type.Null()])),
  list_id: Type.Optional(uuidSchema),
  position: Type.Optional(Type.Number()),
  story_points: Type.Optional(Type.Union([Type.Integer({ minimum: 0 }), Type.Null()])),
  estimated_hours: Type.Optional(Type.Union([Type.Number({ exclusiveMinimum: 0 }), Type.Null()])),
});
export type UpdateCardInput = Static<typeof updateCardSchema>;

export const updateCardPositionsSchema = Type.Array(
  Type.Object({ id: uuidSchema, position: Type.Number(), list_id: Type.Optional(uuidSchema) }),
);
export type UpdateCardPositionsInput = Static<typeof updateCardPositionsSchema>;
