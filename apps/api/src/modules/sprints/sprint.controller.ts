import type { FastifyInstance } from 'fastify';
import {
  createSprintSchema,
  updateSprintSchema,
  completeSprintSchema,
  addCardToSprintSchema,
  reorderSprintCardsSchema,
} from '@levity/domain';
import { validateDto } from '@levity/observability';
import type { SprintService } from '@levity/application';
import type { PreHandler } from '../auth/auth.middleware';

export function sprintRoutes(service: SprintService, authenticate: PreHandler) {
  return async function (fastify: FastifyInstance): Promise<void> {
    fastify.get('/:workspaceId/sprints', { preHandler: [authenticate] }, async (request) => {
      const { workspaceId } = request.params as { workspaceId: string };
      return service.getSprintsByWorkspace(workspaceId, request.user.id);
    });

    fastify.get('/:workspaceId/sprints/active', { preHandler: [authenticate] }, async (request) => {
      const { workspaceId } = request.params as { workspaceId: string };
      return service.getActiveSprint(workspaceId, request.user.id);
    });

    fastify.get('/:workspaceId/sprints/:sprintId', { preHandler: [authenticate] }, async (request) => {
      const { sprintId } = request.params as { sprintId: string };
      return service.getSprintById(sprintId, request.user.id);
    });

    fastify.post('/:workspaceId/sprints', { preHandler: [authenticate] }, async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const input = validateDto(createSprintSchema, request.body);
      const data = await service.createSprint(workspaceId, input, request.user.id);
      reply.status(201);
      return data;
    });

    fastify.patch('/:workspaceId/sprints/:sprintId', { preHandler: [authenticate] }, async (request) => {
      const { sprintId } = request.params as { sprintId: string };
      const input = validateDto(updateSprintSchema, request.body);
      return service.updateSprint(sprintId, input, request.user.id);
    });

    fastify.delete('/:workspaceId/sprints/:sprintId', { preHandler: [authenticate] }, async (request, reply) => {
      const { sprintId } = request.params as { sprintId: string };
      await service.deleteSprint(sprintId, request.user.id);
      reply.status(204).send();
    });

    fastify.post('/:workspaceId/sprints/:sprintId/activate', { preHandler: [authenticate] }, async (request) => {
      const { sprintId } = request.params as { sprintId: string };
      return service.activateSprint(sprintId, request.user.id);
    });

    fastify.post('/:workspaceId/sprints/:sprintId/complete', { preHandler: [authenticate] }, async (request) => {
      const { sprintId } = request.params as { sprintId: string };
      const input = validateDto(completeSprintSchema, request.body ?? {});
      return service.completeSprint(sprintId, input, request.user.id);
    });

    fastify.post('/:workspaceId/sprints/:sprintId/cards', { preHandler: [authenticate] }, async (request, reply) => {
      const { sprintId } = request.params as { sprintId: string };
      const { card_id } = validateDto(addCardToSprintSchema, request.body);
      const data = await service.addCardToSprint(sprintId, card_id, request.user.id);
      reply.status(201);
      return data;
    });

    fastify.delete(
      '/:workspaceId/sprints/:sprintId/cards/:cardId',
      { preHandler: [authenticate] },
      async (request, reply) => {
        const { sprintId, cardId } = request.params as { sprintId: string; cardId: string };
        await service.removeCardFromSprint(sprintId, cardId, request.user.id);
        reply.status(204).send();
      },
    );

    fastify.patch(
      '/:workspaceId/sprints/:sprintId/cards/reorder',
      { preHandler: [authenticate] },
      async (request, reply) => {
        const { sprintId } = request.params as { sprintId: string };
        const input = validateDto(reorderSprintCardsSchema, request.body);
        await service.reorderSprintCards(sprintId, input, request.user.id);
        reply.status(204).send();
      },
    );
  };
}
