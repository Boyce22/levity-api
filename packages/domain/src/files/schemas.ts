import { z } from 'zod';

export const uploadAttachmentSchema = z.object({
  workspace_id: z.uuid(),
});

export const deleteFileSchema = z.object({
  workspace_id: z.uuid(),
  key: z.string().min(1).max(2048),
});

export const fileRouteParamsSchema = z.object({
  workspaceName: z.string().min(1),
  workspaceId: z.uuid(),
  category: z.enum(['attachments', 'avatars']),
  fileName: z.string().min(1).max(512),
});

export type UploadAttachmentInput = z.infer<typeof uploadAttachmentSchema>;
export type DeleteFileInput = z.infer<typeof deleteFileSchema>;
export type FileRouteParams = z.infer<typeof fileRouteParamsSchema>;
