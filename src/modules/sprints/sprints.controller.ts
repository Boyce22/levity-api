import type { FastifyInstance } from 'fastify';
import {
  createSprintSchema,
  updateSprintSchema,
  completeSprintSchema,
  addCardToSprintSchema,
  reorderSprintCardsSchema,
  workspaceIdParamsSchema,
  sprintIdParamsSchema,
  sprintCardParamsSchema,
} from '../../contracts';
import { validateDto } from '../../shared/http';
import type { SprintService } from './sprints.service';
import type { PreHandler } from '../auth/auth.middleware';

export function sprintRoutes(service: SprintService, authenticate: PreHandler) {
  return async function (fastify: FastifyInstance): Promise<void> {
    fastify.get('/:workspaceId/sprints', { preHandler: [authenticate] }, async (request) => {
      const { workspaceId } = validateDto(workspaceIdParamsSchema, request.params);
      return service.getSprintsByWorkspace(workspaceId, request.user.id);
    });

    fastify.get('/:workspaceId/sprints/active', { preHandler: [authenticate] }, async (request) => {
      const { workspaceId } = validateDto(workspaceIdParamsSchema, request.params);
      return service.getActiveSprint(workspaceId, request.user.id);
    });

    fastify.get('/:workspaceId/sprints/:sprintId', { preHandler: [authenticate] }, async (request) => {
      const { sprintId } = validateDto(sprintIdParamsSchema, request.params);
      return service.getSprintById(sprintId, request.user.id);
    });

    fastify.post('/:workspaceId/sprints', { preHandler: [authenticate], schema: { body: createSprintSchema } }, async (request, reply) => {
      const { workspaceId } = validateDto(workspaceIdParamsSchema, request.params);
      const input = validateDto(createSprintSchema, request.body);
      const data = await service.createSprint(workspaceId, input, request.user.id);
      reply.status(201);
      return data;
    });

    fastify.patch('/:workspaceId/sprints/:sprintId', { preHandler: [authenticate], schema: { body: updateSprintSchema } }, async (request) => {
      const { sprintId } = validateDto(sprintIdParamsSchema, request.params);
      const input = validateDto(updateSprintSchema, request.body);
      return service.updateSprint(sprintId, input, request.user.id);
    });

    fastify.delete('/:workspaceId/sprints/:sprintId', { preHandler: [authenticate] }, async (request, reply) => {
      const { sprintId } = validateDto(sprintIdParamsSchema, request.params);
      await service.deleteSprint(sprintId, request.user.id);
      reply.status(204).send();
    });

    fastify.post('/:workspaceId/sprints/:sprintId/activate', { preHandler: [authenticate] }, async (request) => {
      const { sprintId } = validateDto(sprintIdParamsSchema, request.params);
      return service.activateSprint(sprintId, request.user.id);
    });

    fastify.post('/:workspaceId/sprints/:sprintId/complete', { preHandler: [authenticate], schema: { body: completeSprintSchema } }, async (request) => {
      const { sprintId } = validateDto(sprintIdParamsSchema, request.params);
      const input = validateDto(completeSprintSchema, request.body ?? {});
      return service.completeSprint(sprintId, input, request.user.id);
    });

    fastify.post('/:workspaceId/sprints/:sprintId/cards', { preHandler: [authenticate], schema: { body: addCardToSprintSchema } }, async (request, reply) => {
      const { sprintId } = validateDto(sprintIdParamsSchema, request.params);
      const { card_id } = validateDto(addCardToSprintSchema, request.body);
      const data = await service.addCardToSprint(sprintId, card_id, request.user.id);
      reply.status(201);
      return data;
    });

    fastify.delete(
      '/:workspaceId/sprints/:sprintId/cards/:cardId',
      { preHandler: [authenticate] },
      async (request, reply) => {
        const { sprintId, cardId } = validateDto(sprintCardParamsSchema, request.params);
        await service.removeCardFromSprint(sprintId, cardId, request.user.id);
        reply.status(204).send();
      },
    );

    fastify.patch(
      '/:workspaceId/sprints/:sprintId/cards/reorder',
      { preHandler: [authenticate], schema: { body: reorderSprintCardsSchema } },
      async (request, reply) => {
        const { sprintId } = validateDto(sprintIdParamsSchema, request.params);
        const input = validateDto(reorderSprintCardsSchema, request.body);
        await service.reorderSprintCards(sprintId, input, request.user.id);
        reply.status(204).send();
      },
    );
  };
}
