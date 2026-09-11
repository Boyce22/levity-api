import { Type, type Static } from '@sinclair/typebox';
import { uuidSchema } from './typebox';

const uuid = uuidSchema;

export const idParamsSchema = Type.Object({ id: uuid });
export const tokenParamsSchema = Type.Object({ id: uuid, token: Type.String({ minLength: 1 }) });
export const inviteParamsSchema = Type.Object({ id: uuid, inviteId: uuid });
export const tagParamsSchema = Type.Object({ id: uuid, tagId: uuid });
export const priorityParamsSchema = Type.Object({ id: uuid, priorityId: uuid });
export const memberParamsSchema = Type.Object({ id: uuid, memberId: uuid });
export const workspaceIdParamsSchema = Type.Object({ workspaceId: uuid });
export const sprintIdParamsSchema = Type.Object({ sprintId: uuid });
export const boardIdParamsSchema = Type.Object({ boardId: uuid });
export const columnIdParamsSchema = Type.Object({ columnId: uuid });
export const issueIdParamsSchema = Type.Object({ issueId: uuid });
export const boardColumnParamsSchema = Type.Object({ boardId: uuid, columnId: uuid });
export const boardIssueParamsSchema = Type.Object({ boardId: uuid, issueId: uuid });

export type IdParams = Static<typeof idParamsSchema>;
export type TokenParams = Static<typeof tokenParamsSchema>;
export type InviteParams = Static<typeof inviteParamsSchema>;
export type TagParams = Static<typeof tagParamsSchema>;
export type PriorityParams = Static<typeof priorityParamsSchema>;
export type MemberParams = Static<typeof memberParamsSchema>;
export type WorkspaceIdParams = Static<typeof workspaceIdParamsSchema>;
export type SprintIdParams = Static<typeof sprintIdParamsSchema>;
export type BoardIdParams = Static<typeof boardIdParamsSchema>;
export type ColumnIdParams = Static<typeof columnIdParamsSchema>;
export type IssueIdParams = Static<typeof issueIdParamsSchema>;
export type BoardColumnParams = Static<typeof boardColumnParamsSchema>;
export type BoardIssueParams = Static<typeof boardIssueParamsSchema>;
