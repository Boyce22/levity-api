import { Type, type Static } from '@sinclair/typebox';

const uuidPattern = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

export const uploadAttachmentSchema = Type.Object({
  workspace_id: Type.String({ pattern: uuidPattern }),
  file: Type.Unsafe({
    isFile: true,
  }),
});


export const deleteFileSchema = Type.Object({
  workspace_id: Type.String({ format: 'uuid' }),
  key: Type.String({ minLength: 1, maxLength: 2048 }),
});

export const fileRouteParamsSchema = Type.Object({
  workspaceName: Type.String({ minLength: 1 }),
  workspaceId: Type.String({ format: 'uuid' }),
  category: Type.Union([Type.Literal('attachments'), Type.Literal('avatars')]),
  fileName: Type.String({ minLength: 1, maxLength: 512 }),
});

export type UploadAttachmentInput = Static<typeof uploadAttachmentSchema>;
export type DeleteFileInput = Static<typeof deleteFileSchema>;
export type FileRouteParams = Static<typeof fileRouteParamsSchema>;