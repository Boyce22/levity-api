import type { FastifyInstance } from 'fastify';
import {
  createSprintSchema,
  updateSprintSchema,
  completeSprintSchema,
  addIssueToSprintSchema,
  reorderSprintIssuesSchema,
  boardIdParamsSchema,
  boardSprintParamsSchema,
  boardSprintIssueParamsSchema,
} from '../../contracts';
import { validateDto } from '../../shared/http';
import type { SprintService } from './sprints.service';
import type { PreHandler } from '../auth/auth.middleware';

export function sprintRoutes(service: SprintService, authenticate: PreHandler) {
  return async function (fastify: FastifyInstance): Promise<void> {
    fastify.get('/:boardId/sprints', { preHandler: [authenticate] }, async (request) => {
      const { boardId } = validateDto(boardIdParamsSchema, request.params);
      return service.getSprintsByBoard(boardId, request.user.id);
    });

    fastify.get('/:boardId/sprints/active', { preHandler: [authenticate] }, async (request) => {
      const { boardId } = validateDto(boardIdParamsSchema, request.params);
      return service.getActiveSprint(boardId, request.user.id);
    });

    fastify.get('/:boardId/sprints/:sprintId', { preHandler: [authenticate] }, async (request) => {
      const { boardId, sprintId } = validateDto(boardSprintParamsSchema, request.params);
      return service.getSprintById(boardId, sprintId, request.user.id);
    });

    fastify.post('/:boardId/sprints', { preHandler: [authenticate], schema: { body: createSprintSchema } }, async (request, reply) => {
      const { boardId } = validateDto(boardIdParamsSchema, request.params);
      const input = validateDto(createSprintSchema, request.body);
      const data = await service.createSprint(boardId, input, request.user.id);
      reply.status(201);
      return data;
    });

    fastify.patch('/:boardId/sprints/:sprintId', { preHandler: [authenticate], schema: { body: updateSprintSchema } }, async (request) => {
      const { boardId, sprintId } = validateDto(boardSprintParamsSchema, request.params);
      const input = validateDto(updateSprintSchema, request.body);
      return service.updateSprint(boardId, sprintId, input, request.user.id);
    });

    fastify.delete('/:boardId/sprints/:sprintId', { preHandler: [authenticate] }, async (request, reply) => {
      const { boardId, sprintId } = validateDto(boardSprintParamsSchema, request.params);
      await service.deleteSprint(boardId, sprintId, request.user.id);
      reply.status(204).send();
    });

    fastify.post('/:boardId/sprints/:sprintId/activate', { preHandler: [authenticate] }, async (request) => {
      const { boardId, sprintId } = validateDto(boardSprintParamsSchema, request.params);
      return service.activateSprint(boardId, sprintId, request.user.id);
    });

    fastify.post('/:boardId/sprints/:sprintId/complete', { preHandler: [authenticate], schema: { body: completeSprintSchema } }, async (request) => {
      const { boardId, sprintId } = validateDto(boardSprintParamsSchema, request.params);
      const input = validateDto(completeSprintSchema, request.body ?? {});
      return service.completeSprint(boardId, sprintId, input, request.user.id);
    });

    fastify.post('/:boardId/sprints/:sprintId/issues', { preHandler: [authenticate], schema: { body: addIssueToSprintSchema } }, async (request, reply) => {
      const { boardId, sprintId } = validateDto(boardSprintParamsSchema, request.params);
      const { issue_id, position } = validateDto(addIssueToSprintSchema, request.body);
      const data = await service.addIssueToSprint(boardId, sprintId, issue_id, request.user.id, position);
      reply.status(201);
      return data;
    });

    fastify.patch(
      '/:boardId/sprints/:sprintId/issues/reorder',
      { preHandler: [authenticate], schema: { body: reorderSprintIssuesSchema } },
      async (request, reply) => {
        const { boardId, sprintId } = validateDto(boardSprintParamsSchema, request.params);
        const input = validateDto(reorderSprintIssuesSchema, request.body);
        await service.reorderSprintIssues(boardId, sprintId, input, request.user.id);
        reply.status(204).send();
      },
    );

    fastify.delete(
      '/:boardId/sprints/:sprintId/issues/:issueId',
      { preHandler: [authenticate] },
      async (request, reply) => {
        const { boardId, sprintId, issueId } = validateDto(boardSprintIssueParamsSchema, request.params);
        await service.removeIssueFromSprint(boardId, sprintId, issueId, request.user.id);
        reply.status(204).send();
      },
    );
  };
}
