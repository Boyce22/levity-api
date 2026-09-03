import type { FastifyInstance } from 'fastify';
import { saveDiagramSchema, cardIdParamsSchema } from '../../contracts';
import { validateDto } from '../../shared/http';
import type { DiagramsService } from './diagrams.service';
import type { PreHandler } from '../auth/auth.middleware';

export function diagramsRoutes(service: DiagramsService, authenticate: PreHandler) {
  return async function (fastify: FastifyInstance): Promise<void> {
    fastify.get('/:cardId', { preHandler: [authenticate] }, async (request) => {
      const { cardId } = validateDto(cardIdParamsSchema, request.params);
      return service.get(request.user.id, cardId);
    });

    fastify.put('/', { preHandler: [authenticate] }, async (request) => {
      const input = validateDto(saveDiagramSchema, request.body);
      return service.save(request.user.id, input);
    });

    fastify.delete('/:cardId', { preHandler: [authenticate] }, async (request, reply) => {
      const { cardId } = validateDto(cardIdParamsSchema, request.params);
      await service.delete(request.user.id, cardId);
      reply.status(204).send();
    });
  };
}
