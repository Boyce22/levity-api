import { Type, type Static } from '@sinclair/typebox';
import { BoardRole, WorkspaceRole } from '../shared/roles.enum';
import { uuidSchema } from '../shared/typebox';

export const createWorkspaceSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
});
export type CreateWorkspaceInput = Static<typeof createWorkspaceSchema>;

export const renameWorkspaceSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
});
export type RenameWorkspaceInput = Static<typeof renameWorkspaceSchema>;

export const generateInviteSchema = Type.Object({
  max_uses: Type.Integer({ exclusiveMinimum: 0, maximum: 100, default: 1 }),
  expires_in_hours: Type.Optional(Type.Integer({ exclusiveMinimum: 0, maximum: 720 })),
  workspace_role: Type.Enum(WorkspaceRole, { default: WorkspaceRole.MEMBER }),
  board_grants: Type.Array(
    Type.Object({
      board_id: uuidSchema,
      board_role: Type.Enum(BoardRole),
    }),
    { minItems: 1 },
  ),
});
export type GenerateInviteInput = Static<typeof generateInviteSchema>;

export const updateMemberRoleSchema = Type.Object({
  role: Type.Enum(WorkspaceRole),
});
export type UpdateMemberRoleInput = Static<typeof updateMemberRoleSchema>;

export const createTagSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 50 }),
  color: Type.String({ pattern: /^#[0-9a-fA-F]{6}$/.source }),
});
export type CreateTagInput = Static<typeof createTagSchema>;

export const createPrioritySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 50 }),
  color: Type.String({ pattern: /^#[0-9a-fA-F]{6}$/.source }),
  icon: Type.String({ minLength: 1, maxLength: 10 }),
  position: Type.Integer({ minimum: 0, default: 0 }),
});
export type CreatePriorityInput = Static<typeof createPrioritySchema>;

export const workspaceBoardParamsSchema = Type.Object({
  id: uuidSchema,
  boardId: uuidSchema,
});
export type WorkspaceBoardParams = Static<typeof workspaceBoardParamsSchema>;
