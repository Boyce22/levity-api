import type { FastifyInstance } from 'fastify';
import {
  createTagSchema,
  createPrioritySchema,
  idParamsSchema,
  tagParamsSchema,
  priorityParamsSchema,
} from '../../contracts';
import { validateDto } from '../../shared/http';
import type { SettingsService } from './settings.service';
import type { PreHandler } from '../auth/auth.middleware';

export function settingsRoutes(service: SettingsService, authenticate: PreHandler) {
  return async function (fastify: FastifyInstance): Promise<void> {
    fastify.get('/:id/tags', { preHandler: [authenticate] }, async (request) => {
      const { id } = validateDto(idParamsSchema, request.params);
      return service.getTags(request.user.id, id);
    });

    fastify.post('/:id/tags', { preHandler: [authenticate] }, async (request, reply) => {
      const { id } = validateDto(idParamsSchema, request.params);
      const input = validateDto(createTagSchema, request.body);
      const data = await service.createTag(request.user.id, id, input);
      reply.status(201);
      return data;
    });

    fastify.delete('/:id/tags/:tagId', { preHandler: [authenticate] }, async (request, reply) => {
      const { id, tagId } = validateDto(tagParamsSchema, request.params);
      await service.deleteTag(request.user.id, id, tagId);
      reply.status(204).send();
    });

    fastify.get('/:id/priorities', { preHandler: [authenticate] }, async (request) => {
      const { id } = validateDto(idParamsSchema, request.params);
      return service.getPriorities(request.user.id, id);
    });

    fastify.post('/:id/priorities', { preHandler: [authenticate] }, async (request, reply) => {
      const { id } = validateDto(idParamsSchema, request.params);
      const input = validateDto(createPrioritySchema, request.body);
      const data = await service.createPriority(request.user.id, id, input);
      reply.status(201);
      return data;
    });

    fastify.delete('/:id/priorities/:priorityId', { preHandler: [authenticate] }, async (request, reply) => {
      const { id, priorityId } = validateDto(priorityParamsSchema, request.params);
      await service.deletePriority(request.user.id, id, priorityId);
      reply.status(204).send();
    });
  };
}
