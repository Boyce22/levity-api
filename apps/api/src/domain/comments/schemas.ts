import { z } from 'zod';

export const createCommentSchema = z.object({
  card_id: z.uuid(),
  content: z.string().min(1).max(5000),
  parent_id: z.uuid().optional().nullable(),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

export const queryCommentsSchema = z.object({
  card_id: z.uuid(),
  limit: z.coerce.number().int().positive().max(50).default(20),
  cursor: z.string().optional(),
});
export type QueryCommentsInput = z.infer<typeof queryCommentsSchema>;
