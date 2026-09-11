import type { AppInstance } from '../../app';
import {
  createColumnSchema,
  updateColumnSchema,
  updateColumnPositionsSchema,
  createIssueSchema,
  updateIssueSchema,
  updateIssuePositionsSchema,
  boardIdParamsSchema,
  boardColumnParamsSchema,
  boardIssueParamsSchema,
} from '../../contracts';
import type { BoardService } from './board.service';
import type { PreHandler } from '../auth/auth.middleware';

export function boardRoutes(service: BoardService, authenticate: PreHandler) {
  return async function (fastify: AppInstance): Promise<void> {

    fastify.get('/:boardId', { preHandler: [authenticate], schema: { params: boardIdParamsSchema } }, async (request) => {
      return service.getBoardData(request.user.id, request.params.boardId);
    });

    fastify.post(
      '/:boardId/columns',
      { preHandler: [authenticate], schema: { params: boardIdParamsSchema, body: createColumnSchema } },
      async (request, reply) => {
        const data = await service.createColumn(request.user.id, request.params.boardId, request.body);
        reply.status(201);
        return data;
      },
    );

    fastify.patch(
      '/:boardId/columns/positions',
      { preHandler: [authenticate], schema: { params: boardIdParamsSchema, body: updateColumnPositionsSchema } },
      async (request, reply) => {
        await service.updateColumnPositions(request.user.id, request.params.boardId, request.body);
        reply.status(204).send();
      },
    );

    fastify.patch(
      '/:boardId/columns/:columnId',
      { preHandler: [authenticate], schema: { params: boardColumnParamsSchema, body: updateColumnSchema } },
      async (request) => {
        return service.updateColumn(
          request.user.id,
          request.params.boardId,
          request.params.columnId,
          request.body,
        );
      },
    );

    fastify.delete(
      '/:boardId/columns/:columnId',
      { preHandler: [authenticate], schema: { params: boardColumnParamsSchema } },
      async (request, reply) => {
        await service.deleteColumn(request.user.id, request.params.boardId, request.params.columnId);
        reply.status(204).send();
      },
    );

    fastify.post(
      '/:boardId/issues',
      { preHandler: [authenticate], schema: { params: boardIdParamsSchema, body: createIssueSchema } },
      async (request, reply) => {
        const data = await service.createIssue(request.user.id, request.params.boardId, request.body);
        reply.status(201);
        return data;
      },
    );

    fastify.patch(
      '/:boardId/issues/positions',
      { preHandler: [authenticate], schema: { params: boardIdParamsSchema, body: updateIssuePositionsSchema } },
      async (request, reply) => {
        await service.updateIssuePositions(request.user.id, request.params.boardId, request.body);
        reply.status(204).send();
      },
    );

    fastify.patch(
      '/:boardId/issues/:issueId',
      { preHandler: [authenticate], schema: { params: boardIssueParamsSchema, body: updateIssueSchema } },
      async (request) => {
        return service.updateIssue(
          request.user.id,
          request.params.boardId,
          request.params.issueId,
          request.body,
        );
      },
    );

    fastify.delete(
      '/:boardId/issues/:issueId',
      { preHandler: [authenticate], schema: { params: boardIssueParamsSchema } },
      async (request, reply) => {
        await service.deleteIssue(request.user.id, request.params.boardId, request.params.issueId);
        reply.status(204).send();
      },
    );

    fastify.get(
      '/:boardId/issues/:issueId/history',
      { preHandler: [authenticate], schema: { params: boardIssueParamsSchema } },
      async (request) => {
        return service.getIssueEvents(request.user.id, request.params.boardId, request.params.issueId);
      },
    );
  };
}
