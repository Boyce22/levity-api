import type { AppInstance } from '../../app';
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
import type { SprintService } from './sprints.service';
import type { PreHandler } from '../auth/auth.middleware';

export function sprintRoutes(service: SprintService, authenticate: PreHandler) {
  return async function (fastify: AppInstance): Promise<void> {

    fastify.get(
      '/:boardId/sprints',
      { preHandler: [authenticate], schema: { params: boardIdParamsSchema } },
      async (request) => {
        return service.getSprintsByBoard(request.params.boardId, request.user.id);
      },
    );

    fastify.get(
      '/:boardId/sprints/active',
      { preHandler: [authenticate], schema: { params: boardIdParamsSchema } },
      async (request) => {
        return service.getActiveSprint(request.params.boardId, request.user.id);
      },
    );

    fastify.get(
      '/:boardId/sprints/:sprintId',
      { preHandler: [authenticate], schema: { params: boardSprintParamsSchema } },
      async (request) => {
        return service.getSprintById(request.params.boardId, request.params.sprintId, request.user.id);
      },
    );

    fastify.post(
      '/:boardId/sprints',
      { preHandler: [authenticate], schema: { params: boardIdParamsSchema, body: createSprintSchema } },
      async (request, reply) => {
        const data = await service.createSprint(request.params.boardId, request.body, request.user.id);
        reply.status(201);
        return data;
      },
    );

    fastify.patch(
      '/:boardId/sprints/:sprintId',
      { preHandler: [authenticate], schema: { params: boardSprintParamsSchema, body: updateSprintSchema } },
      async (request) => {
        return service.updateSprint(
          request.params.boardId,
          request.params.sprintId,
          request.body,
          request.user.id,
        );
      },
    );

    fastify.delete(
      '/:boardId/sprints/:sprintId',
      { preHandler: [authenticate], schema: { params: boardSprintParamsSchema } },
      async (request, reply) => {
        await service.deleteSprint(request.params.boardId, request.params.sprintId, request.user.id);
        reply.status(204).send();
      },
    );

    fastify.post(
      '/:boardId/sprints/:sprintId/activate',
      { preHandler: [authenticate], schema: { params: boardSprintParamsSchema } },
      async (request) => {
        return service.activateSprint(request.params.boardId, request.params.sprintId, request.user.id);
      },
    );

    fastify.post(
      '/:boardId/sprints/:sprintId/complete',
      { preHandler: [authenticate], schema: { params: boardSprintParamsSchema, body: completeSprintSchema } },
      async (request) => {
        return service.completeSprint(
          request.params.boardId,
          request.params.sprintId,
          request.body,
          request.user.id,
        );
      },
    );

    fastify.post(
      '/:boardId/sprints/:sprintId/issues',
      { preHandler: [authenticate], schema: { params: boardSprintParamsSchema, body: addIssueToSprintSchema } },
      async (request, reply) => {
        const data = await service.addIssueToSprint(
          request.params.boardId,
          request.params.sprintId,
          request.body.issue_id,
          request.user.id,
          request.body.position,
        );
        reply.status(201);
        return data;
      },
    );

    fastify.patch(
      '/:boardId/sprints/:sprintId/issues/reorder',
      { preHandler: [authenticate], schema: { params: boardSprintParamsSchema, body: reorderSprintIssuesSchema } },
      async (request, reply) => {
        await service.reorderSprintIssues(
          request.params.boardId,
          request.params.sprintId,
          request.body,
          request.user.id,
        );
        reply.status(204).send();
      },
    );

    fastify.delete(
      '/:boardId/sprints/:sprintId/issues/:issueId',
      { preHandler: [authenticate], schema: { params: boardSprintIssueParamsSchema } },
      async (request, reply) => {
        await service.removeIssueFromSprint(
          request.params.boardId,
          request.params.sprintId,
          request.params.issueId,
          request.user.id,
        );
        reply.status(204).send();
      },
    );
  };
}
