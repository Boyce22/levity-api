import type { FastifyInstance, FastifyRequest } from 'fastify';
import { ALLOWED_IMAGE_TYPES, type UploadedFile } from '@levity/domain';
import { BadRequestError } from '@levity/observability';
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
      const workspaceId = multipartField(fields, 'workspace_id');
      if (!workspaceId) throw new BadRequestError('workspace_id is required');
      const data = await service.uploadAttachment(request.user.id, workspaceId, file);
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
      const body = request.body as { workspace_id?: string; key?: string } | undefined;
      if (!body?.workspace_id || !body.key) {
        throw new BadRequestError('workspace_id and key are required');
      }
      await service.deleteFile(request.user.id, body.workspace_id, body.key);
      reply.status(204).send();
    });
  };
}
