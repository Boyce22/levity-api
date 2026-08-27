import { z } from 'zod';

export const updateUserSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  avatar_url: z.string().optional(),
  bio: z.string().max(500).optional(),
  email: z.email().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const queryUsersSchema = z.object({
  workspace_id: z.uuid().optional(),
  search: z.string().optional(),
});

export type QueryUsersInput = z.infer<typeof queryUsersSchema>;
