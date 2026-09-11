import type { FastifyRequest } from 'fastify';
import type { AppInstance } from '../../app';
import {
  ALLOWED_IMAGE_TYPES,
  deleteFileSchema,
  fileRouteParamsSchema,
  uploadAttachmentSchema,
  uploadAvatarSchema,
  type UploadedFile,
} from '../../contracts';
import { BadRequestError } from '../../shared';
import type { FilesService } from './files.service';
import type { PreHandler } from '../auth/auth.middleware';

const skipBodyValidation = {
  validatorCompiler: () => () => true,
};

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
    file: { file: part, buffer, originalname: part.filename, mimetype: part.mimetype },
    fields: part.fields as Record<string, { value?: string } | Array<{ value?: string }> | undefined>,
  };
}

export function filesRoutes(service: FilesService, authenticate: PreHandler) {
  return async function (fastify: AppInstance): Promise<void> {
    fastify.post(
      '/attachments',
      {
        preHandler: [authenticate],
        ...skipBodyValidation,
        schema: { consumes: ['multipart/form-data'], body: uploadAttachmentSchema },
      },
      async (request, reply) => {
        const { file, fields } = await readUploadedFile(request);
        const workspace_id = multipartField(fields, 'workspace_id');
        if (!workspace_id) throw new BadRequestError('workspace_id is required');
        const data = await service.uploadAttachment(request.user.id, workspace_id, file);
        reply.status(201);
        return data;
      },
    );

    fastify.post(
      '/avatar',
      {
        preHandler: [authenticate],
        ...skipBodyValidation,
        schema: { consumes: ['multipart/form-data'], body: uploadAvatarSchema },
      },
      async (request, reply) => {
        const file = await request.file();
        if (!file) throw new BadRequestError('No file provided');
        if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
          throw new BadRequestError(`File type not allowed: ${file.mimetype}`);
        }
        const data = await service.uploadAvatar(request.user.id, file);
        reply.status(201);
        return data;
      },
    );

    fastify.delete(
      '/attachments',
      { preHandler: [authenticate], schema: { body: deleteFileSchema } },
      async (request, reply) => {
        const { workspace_id, key } = request.body;
        await service.deleteFile(request.user.id, workspace_id, key);
        reply.status(204).send();
      },
    );

    fastify.get(
      '/:workspaceName/:workspaceId/:category/:fileName',
      { preHandler: [authenticate], schema: { params: fileRouteParamsSchema } },
      async (request, reply) => {
        const { workspaceId, category, fileName } = request.params;
        const url = await service.getSignedDownloadUrl(request.user.id, workspaceId, category, fileName);
        return reply.type('application/json').send(JSON.stringify(url));
      },
    );
  };
}
