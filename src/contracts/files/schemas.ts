import { Type, type Static } from '@sinclair/typebox';
import { uuidSchema } from '../shared/typebox';

const filePart = Type.Unsafe({
  type: 'string',
  format: 'binary',
  isFile: true,
});

export const uploadAvatarSchema = Type.Object({
  file: filePart,
});

export const uploadAttachmentSchema = Type.Object({
  workspace_id: uuidSchema,
  file: filePart,
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

export type UploadAvatarInput = Static<typeof uploadAvatarSchema>;
export type UploadAttachmentInput = Static<typeof uploadAttachmentSchema>;
export type DeleteFileInput = Static<typeof deleteFileSchema>;
export type FileRouteParams = Static<typeof fileRouteParamsSchema>;
