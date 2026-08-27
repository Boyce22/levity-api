import { z } from 'zod';
import { Role } from '../shared/roles.enum';

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
});
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const renameWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
});
export type RenameWorkspaceInput = z.infer<typeof renameWorkspaceSchema>;

export const generateInviteSchema = z.object({
  max_uses: z.number().int().positive().max(100).default(1),
  expires_in_hours: z.number().int().positive().max(720).optional(),
  role: z.enum(Role).default(Role.MEMBER),
});
export type GenerateInviteInput = z.infer<typeof generateInviteSchema>;

export const updateMemberRoleSchema = z.object({
  role: z.enum(Role),
});
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});
export type CreateTagInput = z.infer<typeof createTagSchema>;

export const createPrioritySchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.string().min(1).max(10),
  position: z.number().int().min(0).default(0),
});
export type CreatePriorityInput = z.infer<typeof createPrioritySchema>;
