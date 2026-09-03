import type { FastifyInstance } from 'fastify';
import {
  createListSchema,
  updateListSchema,
  updateListPositionsSchema,
  createCardSchema,
  updateCardSchema,
  updateCardPositionsSchema,
  workspaceIdParamsSchema,
  listIdParamsSchema,
  cardIdParamsSchema,
} from '../../contracts';
import { validateDto } from '../../shared/http';
import type { BoardService } from './board.service';
import type { PreHandler } from '../auth/auth.middleware';

export function boardRoutes(service: BoardService, authenticate: PreHandler) {
  return async function (fastify: FastifyInstance): Promise<void> {
    fastify.get('/:workspaceId/board', { preHandler: [authenticate] }, async (request) => {
      const { workspaceId } = validateDto(workspaceIdParamsSchema, request.params);
      return service.getBoardData(request.user.id, workspaceId);
    });

    fastify.post('/:workspaceId/lists', { preHandler: [authenticate] }, async (request, reply) => {
      const { workspaceId } = validateDto(workspaceIdParamsSchema, request.params);
      const input = validateDto(createListSchema, request.body);
      const data = await service.createList(request.user.id, workspaceId, input);
      reply.status(201);
      return data;
    });

    fastify.patch('/:workspaceId/lists/positions', { preHandler: [authenticate] }, async (request, reply) => {
      const { workspaceId } = validateDto(workspaceIdParamsSchema, request.params);
      const input = validateDto(updateListPositionsSchema, request.body);
      await service.updateListPositions(request.user.id, workspaceId, input);
      reply.status(204).send();
    });

    fastify.patch('/:workspaceId/lists/:listId', { preHandler: [authenticate] }, async (request) => {
      const { listId } = validateDto(listIdParamsSchema, request.params);
      const input = validateDto(updateListSchema, request.body);
      return service.updateList(request.user.id, listId, input);
    });

    fastify.delete('/:workspaceId/lists/:listId', { preHandler: [authenticate] }, async (request, reply) => {
      const { listId } = validateDto(listIdParamsSchema, request.params);
      await service.deleteList(request.user.id, listId);
      reply.status(204).send();
    });

    fastify.post('/:workspaceId/cards', { preHandler: [authenticate] }, async (request, reply) => {
      const input = validateDto(createCardSchema, request.body);
      const data = await service.createCard(request.user.id, input);
      reply.status(201);
      return data;
    });

    fastify.patch('/:workspaceId/cards/positions', { preHandler: [authenticate] }, async (request, reply) => {
      const { workspaceId } = validateDto(workspaceIdParamsSchema, request.params);
      const input = validateDto(updateCardPositionsSchema, request.body);
      await service.updateCardPositions(request.user.id, workspaceId, input);
      reply.status(204).send();
    });

    fastify.patch('/:workspaceId/cards/:cardId', { preHandler: [authenticate] }, async (request) => {
      const { cardId } = validateDto(cardIdParamsSchema, request.params);
      const input = validateDto(updateCardSchema, request.body);
      return service.updateCard(request.user.id, cardId, input);
    });

    fastify.delete('/:workspaceId/cards/:cardId', { preHandler: [authenticate] }, async (request, reply) => {
      const { cardId } = validateDto(cardIdParamsSchema, request.params);
      await service.deleteCard(request.user.id, cardId);
      reply.status(204).send();
    });

    fastify.get('/:workspaceId/cards/:cardId/history', { preHandler: [authenticate] }, async (request) => {
      const { cardId } = validateDto(cardIdParamsSchema, request.params);
      return service.getCardHistory(request.user.id, cardId);
    });
  };
}
