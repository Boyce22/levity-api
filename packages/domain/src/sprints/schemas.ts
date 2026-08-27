import { z } from 'zod';
import { SprintTrackingMode } from './enums';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');

export const createSprintSchema = z.object({
  name: z.string().min(1).max(100),
  goal: z.string().max(500).optional(),
  start_date: dateSchema,
  end_date: dateSchema,
  tracking_mode: z.enum(SprintTrackingMode),
  capacity_points: z.number().positive().optional(),
});

export const updateSprintSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  goal: z.string().max(500).nullable().optional(),
  start_date: dateSchema.optional(),
  end_date: dateSchema.optional(),
  tracking_mode: z.enum(SprintTrackingMode).optional(),
  capacity_points: z.number().positive().nullable().optional(),
});

export const completeSprintSchema = z.object({
  to_sprint_id: z.uuid().optional(),
});

export const addCardToSprintSchema = z.object({
  card_id: z.uuid(),
  position: z.number().int().min(0).default(0),
});

export const reorderSprintCardsSchema = z.array(
  z.object({
    id: z.uuid(),
    position: z.number().int().min(0),
  }),
);

export type CreateSprintInput = z.infer<typeof createSprintSchema>;
export type UpdateSprintInput = z.infer<typeof updateSprintSchema>;
export type CompleteSprintInput = z.infer<typeof completeSprintSchema>;
export type AddCardToSprintInput = z.infer<typeof addCardToSprintSchema>;
export type ReorderSprintCardsInput = z.infer<typeof reorderSprintCardsSchema>;
