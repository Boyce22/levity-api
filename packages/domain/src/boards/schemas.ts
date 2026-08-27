import { z } from 'zod';
import { ListType } from '../shared/list-type.enum';

export const createListSchema = z.object({
  title: z.string().min(1).max(100),
  position: z.number().default(0),
});
export type CreateListInput = z.infer<typeof createListSchema>;

export const updateListSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  position: z.number().optional(),
  wip_limit: z.number().int().positive().nullable().optional(),
  list_type: z.enum(ListType).nullable().optional(),
});
export type UpdateListInput = z.infer<typeof updateListSchema>;

export const updateListPositionsSchema = z.array(
  z.object({ id: z.uuid(), position: z.number() }),
);
export type UpdateListPositionsInput = z.infer<typeof updateListPositionsSchema>;

export const createCardSchema = z.object({
  content: z.string().min(1).max(500),
  list_id: z.uuid(),
  position: z.number().default(0),
});
export type CreateCardInput = z.infer<typeof createCardSchema>;

export const updateCardSchema = z.object({
  content: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).nullable().optional(),
  cover_url: z.string().url().nullable().optional(),
  assignee_id: z.uuid().nullable().optional(),
  priority: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
  progress: z.number().int().min(0).max(100).nullable().optional(),
  due_date: z.string().datetime().nullable().optional(),
  list_id: z.uuid().optional(),
  position: z.number().optional(),
});
export type UpdateCardInput = z.infer<typeof updateCardSchema>;

export const updateCardPositionsSchema = z.array(
  z.object({ id: z.uuid(), position: z.number(), list_id: z.uuid().optional() }),
);
export type UpdateCardPositionsInput = z.infer<typeof updateCardPositionsSchema>;
