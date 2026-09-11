import { Type, type Static } from '@sinclair/typebox';
import { BoardColumnType } from '../shared/board-column-type.enum';
import { dateTimeSchema, uuidSchema } from '../shared/typebox';

export const createColumnSchema = Type.Object({
  title: Type.String({ minLength: 1, maxLength: 100 }),
  position: Type.Number({ default: 0 }),
  wip_limit: Type.Optional(Type.Union([Type.Integer({ exclusiveMinimum: 0 }), Type.Null()])),
  column_type: Type.Optional(Type.Union([Type.Enum(BoardColumnType), Type.Null()])),
});
export type CreateColumnInput = Static<typeof createColumnSchema>;

export const updateColumnSchema = Type.Object({
  title: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  position: Type.Optional(Type.Number()),
  wip_limit: Type.Optional(Type.Union([Type.Integer({ exclusiveMinimum: 0 }), Type.Null()])),
  column_type: Type.Optional(Type.Union([Type.Enum(BoardColumnType), Type.Null()])),
});
export type UpdateColumnInput = Static<typeof updateColumnSchema>;

export const updateColumnPositionsSchema = Type.Array(
  Type.Object({ id: uuidSchema, position: Type.Number() }),
);
export type UpdateColumnPositionsInput = Static<typeof updateColumnPositionsSchema>;

export const createIssueSchema = Type.Object({
  content: Type.String({ minLength: 1, maxLength: 500 }),
  column_id: uuidSchema,
  position: Type.Number({ default: 0 }),
  description: Type.Optional(Type.Union([Type.String({ maxLength: 10000 }), Type.Null()])),
  priority_id: Type.Optional(uuidSchema),
  tag_id: Type.Optional(uuidSchema),
  assignee_id: Type.Optional(uuidSchema),
  story_points: Type.Optional(Type.Integer({ minimum: 0 })),
  estimated_hours: Type.Optional(Type.Number({ exclusiveMinimum: 0 })),
});
export type CreateIssueInput = Static<typeof createIssueSchema>;

export const updateIssueSchema = Type.Object({
  content: Type.Optional(Type.String({ minLength: 1, maxLength: 500 })),
  description: Type.Optional(Type.Union([Type.String({ maxLength: 10000 }), Type.Null()])),
  cover_url: Type.Optional(Type.Union([Type.String({ maxLength: 2048 }), Type.Null()])),
  assignee_id: Type.Optional(Type.Union([uuidSchema, Type.Null()])),
  priority_id: Type.Optional(uuidSchema),
  tag_id: Type.Optional(Type.Union([uuidSchema, Type.Null()])),
  progress: Type.Optional(Type.Union([Type.Integer({ minimum: 0, maximum: 100 }), Type.Null()])),
  due_date: Type.Optional(Type.Union([dateTimeSchema, Type.Null()])),
  column_id: Type.Optional(uuidSchema),
  position: Type.Optional(Type.Number()),
  story_points: Type.Optional(Type.Union([Type.Integer({ minimum: 0 }), Type.Null()])),
  estimated_hours: Type.Optional(Type.Union([Type.Number({ exclusiveMinimum: 0 }), Type.Null()])),
});
export type UpdateIssueInput = Static<typeof updateIssueSchema>;

export const updateIssuePositionsSchema = Type.Array(
  Type.Object({ id: uuidSchema, position: Type.Number(), column_id: Type.Optional(uuidSchema) }),
);
export type UpdateIssuePositionsInput = Static<typeof updateIssuePositionsSchema>;
