import { Type, type Static } from '@sinclair/typebox';
import { uuidSchema } from '../shared/typebox';

export const uploadAttachmentSchema = Type.Object({
  workspace_id: uuidSchema,
});

export const deleteFileSchema = Type.Object({
  workspace_id: uuidSchema,
  key: Type.String({ minLength: 1, maxLength: 2048 }),
});

export const fileRouteParamsSchema = Type.Object({
  workspaceName: Type.String({ minLength: 1 }),
  workspaceId: uuidSchema,
  category: Type.Union([Type.Literal('attachments'), Type.Literal('avatars')]),
  fileName: Type.String({ minLength: 1, maxLength: 512 }),
});

export type UploadAttachmentInput = Static<typeof uploadAttachmentSchema>;
export type DeleteFileInput = Static<typeof deleteFileSchema>;
export type FileRouteParams = Static<typeof fileRouteParamsSchema>;
