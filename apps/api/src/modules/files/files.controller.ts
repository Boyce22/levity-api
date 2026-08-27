import type { FastifyInstance, FastifyRequest } from 'fastify';
import {
  ALLOWED_IMAGE_TYPES,
  deleteFileSchema,
  fileRouteParamsSchema,
  uploadAttachmentSchema,
  type UploadedFile,
} from '@levity/domain';
import { BadRequestError, validateDto } from '@levity/observability';
import type { FilesService } from '@levity/application';
import type { PreHandler } from '../auth/auth.middleware';

function multipartField(
  fields: Record<string, { value?: string } | Array<{ value?: string }> | undefined>,
  name: string,
): string | undefined {
  const field = fields[name];
  if (!field) return undefined;
  if (Array.isArray(field)) return field[0]?.value;
  return field.value;
}

async function readUploadedFile(request: FastifyRequest): Promise<{
  file: UploadedFile;
  fields: Record<string, { value?: string } | Array<{ value?: string }> | undefined>;
}> {
  const part = await request.file();
  if (!part) throw new BadRequestError('No file provided');
  if (!ALLOWED_IMAGE_TYPES.includes(part.mimetype)) {
    throw new BadRequestError(`File type not allowed: ${part.mimetype}`);
  }
  const buffer = await part.toBuffer();
  return {
    file: { buffer, originalname: part.filename, mimetype: part.mimetype },
    fields: part.fields as Record<string, { value?: string } | Array<{ value?: string }> | undefined>,
  };
}

export function filesRoutes(service: FilesService, authenticate: PreHandler) {
  return async function (fastify: FastifyInstance): Promise<void> {
    fastify.post('/attachments', { preHandler: [authenticate] }, async (request, reply) => {
      const { file, fields } = await readUploadedFile(request);
      const { workspace_id } = validateDto(uploadAttachmentSchema, {
        workspace_id: multipartField(fields, 'workspace_id'),
      });
      const data = await service.uploadAttachment(request.user.id, workspace_id, file);
      reply.status(201);
      return data;
    });

    fastify.post('/avatar', { preHandler: [authenticate] }, async (request, reply) => {
      const { file } = await readUploadedFile(request);
      const data = await service.uploadAvatar(request.user.id, file);
      reply.status(201);
      return data;
    });

    fastify.delete('/attachments', { preHandler: [authenticate] }, async (request, reply) => {
      const { workspace_id, key } = validateDto(deleteFileSchema, request.body);
      await service.deleteFile(request.user.id, workspace_id, key);
      reply.status(204).send();
    });

    fastify.get(
      '/:workspaceName/:workspaceId/:category/:fileName',
      { preHandler: [authenticate] },
      async (request, reply) => {
        const { workspaceId, category, fileName } = validateDto(fileRouteParamsSchema, request.params);
        const url = await service.getSignedDownloadUrl(request.user.id, workspaceId, category, fileName);
        return reply.type('application/json').send(JSON.stringify(url));
      },
    );
  };
}
