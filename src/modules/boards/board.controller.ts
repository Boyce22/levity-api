import type { FastifyInstance } from 'fastify';
import {
  createColumnSchema,
  updateColumnSchema,
  updateColumnPositionsSchema,
  createIssueSchema,
  updateIssueSchema,
  updateIssuePositionsSchema,
  boardIdParamsSchema,
  columnIdParamsSchema,
  issueIdParamsSchema,
} from '../../contracts';
import { validateDto } from '../../shared/http';
import type { BoardService } from './board.service';
import type { PreHandler } from '../auth/auth.middleware';

export function boardRoutes(service: BoardService, authenticate: PreHandler) {
  return async function (fastify: FastifyInstance): Promise<void> {
    fastify.get('/:boardId', { preHandler: [authenticate] }, async (request) => {
      const { boardId } = validateDto(boardIdParamsSchema, request.params);
      return service.getBoardData(request.user.id, boardId);
    });

    fastify.post('/:boardId/columns', { preHandler: [authenticate], schema: { body: createColumnSchema } }, async (request, reply) => {
      const { boardId } = validateDto(boardIdParamsSchema, request.params);
      const input = validateDto(createColumnSchema, request.body);
      const data = await service.createColumn(request.user.id, boardId, input);
      reply.status(201);
      return data;
    });

    fastify.patch('/:boardId/columns/positions', { preHandler: [authenticate], schema: { body: updateColumnPositionsSchema } }, async (request, reply) => {
      const { boardId } = validateDto(boardIdParamsSchema, request.params);
      const input = validateDto(updateColumnPositionsSchema, request.body);
      await service.updateColumnPositions(request.user.id, boardId, input);
      reply.status(204).send();
    });

    fastify.patch('/:boardId/columns/:columnId', { preHandler: [authenticate], schema: { body: updateColumnSchema } }, async (request) => {
      const { boardId } = validateDto(boardIdParamsSchema, request.params);
      const { columnId } = validateDto(columnIdParamsSchema, request.params);
      const input = validateDto(updateColumnSchema, request.body);
      return service.updateColumn(request.user.id, boardId, columnId, input);
    });

    fastify.delete('/:boardId/columns/:columnId', { preHandler: [authenticate] }, async (request, reply) => {
      const { boardId } = validateDto(boardIdParamsSchema, request.params);
      const { columnId } = validateDto(columnIdParamsSchema, request.params);
      await service.deleteColumn(request.user.id, boardId, columnId);
      reply.status(204).send();
    });

    fastify.post('/:boardId/issues', { preHandler: [authenticate], schema: { body: createIssueSchema } }, async (request, reply) => {
      const { boardId } = validateDto(boardIdParamsSchema, request.params);
      const input = validateDto(createIssueSchema, request.body);
      const data = await service.createIssue(request.user.id, boardId, input);
      reply.status(201);
      return data;
    });

    fastify.patch('/:boardId/issues/positions', { preHandler: [authenticate], schema: { body: updateIssuePositionsSchema } }, async (request, reply) => {
      const { boardId } = validateDto(boardIdParamsSchema, request.params);
      const input = validateDto(updateIssuePositionsSchema, request.body);
      await service.updateIssuePositions(request.user.id, boardId, input);
      reply.status(204).send();
    });

    fastify.patch('/:boardId/issues/:issueId', { preHandler: [authenticate], schema: { body: updateIssueSchema } }, async (request) => {
      const { boardId } = validateDto(boardIdParamsSchema, request.params);
      const { issueId } = validateDto(issueIdParamsSchema, request.params);
      const input = validateDto(updateIssueSchema, request.body);
      return service.updateIssue(request.user.id, boardId, issueId, input);
    });

    fastify.delete('/:boardId/issues/:issueId', { preHandler: [authenticate] }, async (request, reply) => {
      const { boardId } = validateDto(boardIdParamsSchema, request.params);
      const { issueId } = validateDto(issueIdParamsSchema, request.params);
      await service.deleteIssue(request.user.id, boardId, issueId);
      reply.status(204).send();
    });

    fastify.get('/:boardId/issues/:issueId/history', { preHandler: [authenticate] }, async (request) => {
      const { boardId } = validateDto(boardIdParamsSchema, request.params);
      const { issueId } = validateDto(issueIdParamsSchema, request.params);
      return service.getIssueEvents(request.user.id, boardId, issueId);
    });
  };
}
