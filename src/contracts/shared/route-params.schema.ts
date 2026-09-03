import { z } from 'zod';

const uuid = z.uuid();

export const idParamsSchema = z.object({ id: uuid });
export const tokenParamsSchema = z.object({ id: uuid, token: z.string().min(1) });
export const inviteParamsSchema = z.object({ id: uuid, inviteId: uuid });
export const tagParamsSchema = z.object({ id: uuid, tagId: uuid });
export const priorityParamsSchema = z.object({ id: uuid, priorityId: uuid });
export const memberParamsSchema = z.object({ id: uuid, memberId: uuid });
export const workspaceIdParamsSchema = z.object({ workspaceId: uuid });
export const sprintIdParamsSchema = z.object({ sprintId: uuid });
export const sprintCardParamsSchema = z.object({ sprintId: uuid, cardId: uuid });
export const cardIdParamsSchema = z.object({ cardId: uuid });
export const listIdParamsSchema = z.object({ listId: uuid });

export type IdParams = z.infer<typeof idParamsSchema>;
export type TokenParams = z.infer<typeof tokenParamsSchema>;
export type InviteParams = z.infer<typeof inviteParamsSchema>;
export type TagParams = z.infer<typeof tagParamsSchema>;
export type PriorityParams = z.infer<typeof priorityParamsSchema>;
export type MemberParams = z.infer<typeof memberParamsSchema>;
export type WorkspaceIdParams = z.infer<typeof workspaceIdParamsSchema>;
export type SprintIdParams = z.infer<typeof sprintIdParamsSchema>;
export type SprintCardParams = z.infer<typeof sprintCardParamsSchema>;
export type CardIdParams = z.infer<typeof cardIdParamsSchema>;
export type ListIdParams = z.infer<typeof listIdParamsSchema>;
