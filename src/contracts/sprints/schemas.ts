import { Type, type Static } from '@sinclair/typebox';
import { SprintTrackingMode } from './enums';
import { dateOnlySchema, uuidSchema } from '../shared/typebox';

const dateSchema = dateOnlySchema();

export const createSprintSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  goal: Type.Optional(Type.String({ maxLength: 500 })),
  start_date: dateSchema,
  end_date: dateSchema,
  tracking_mode: Type.Enum(SprintTrackingMode),
  capacity_points: Type.Optional(Type.Number({ exclusiveMinimum: 0 })),
});

export const updateSprintSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  goal: Type.Optional(Type.Union([Type.String({ maxLength: 500 }), Type.Null()])),
  start_date: Type.Optional(dateSchema),
  end_date: Type.Optional(dateSchema),
  tracking_mode: Type.Optional(Type.Enum(SprintTrackingMode)),
  capacity_points: Type.Optional(Type.Union([Type.Number({ exclusiveMinimum: 0 }), Type.Null()])),
});

export const completeSprintSchema = Type.Object({
  to_sprint_id: Type.Optional(uuidSchema),
});

export const addCardToSprintSchema = Type.Object({
  card_id: uuidSchema,
  position: Type.Integer({ minimum: 0, default: 0 }),
});

export const reorderSprintCardsSchema = Type.Array(
  Type.Object({
    id: uuidSchema,
    position: Type.Integer({ minimum: 0 }),
  }),
);

export type CreateSprintInput = Static<typeof createSprintSchema>;
export type UpdateSprintInput = Static<typeof updateSprintSchema>;
export type CompleteSprintInput = Static<typeof completeSprintSchema>;
export type AddCardToSprintInput = Static<typeof addCardToSprintSchema>;
export type ReorderSprintCardsInput = Static<typeof reorderSprintCardsSchema>;
