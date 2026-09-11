import type { AppInstance } from '../../app';
import {
  createTagSchema,
  createPrioritySchema,
  idParamsSchema,
  tagParamsSchema,
  priorityParamsSchema,
} from '../../contracts';
import type { SettingsService } from './settings.service';
import type { PreHandler } from '../auth/auth.middleware';

export function settingsRoutes(service: SettingsService, authenticate: PreHandler) {
  return async function (fastify: AppInstance): Promise<void> {

    fastify.get('/:id/tags', { preHandler: [authenticate], schema: { params: idParamsSchema } }, async (request) => {
      return service.getTags(request.user.id, request.params.id);
    });

    fastify.post(
      '/:id/tags',
      { preHandler: [authenticate], schema: { params: idParamsSchema, body: createTagSchema } },
      async (request, reply) => {
        const data = await service.createTag(request.user.id, request.params.id, request.body);
        reply.status(201);
        return data;
      },
    );

    fastify.delete(
      '/:id/tags/:tagId',
      { preHandler: [authenticate], schema: { params: tagParamsSchema } },
      async (request, reply) => {
        await service.deleteTag(request.user.id, request.params.id, request.params.tagId);
        reply.status(204).send();
      },
    );

    fastify.get('/:id/priorities', { preHandler: [authenticate], schema: { params: idParamsSchema } }, async (request) => {
      return service.getPriorities(request.user.id, request.params.id);
    });

    fastify.post(
      '/:id/priorities',
      { preHandler: [authenticate], schema: { params: idParamsSchema, body: createPrioritySchema } },
      async (request, reply) => {
        const data = await service.createPriority(request.user.id, request.params.id, request.body);
        reply.status(201);
        return data;
      },
    );

    fastify.delete(
      '/:id/priorities/:priorityId',
      { preHandler: [authenticate], schema: { params: priorityParamsSchema } },
      async (request, reply) => {
        await service.deletePriority(request.user.id, request.params.id, request.params.priorityId);
        reply.status(204).send();
      },
    );
  };
}
