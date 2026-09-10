import type { FastifyInstance } from 'fastify';
import { saveDiagramSchema, issueIdParamsSchema } from '../../contracts';
import { validateDto } from '../../shared/http';
import type { DiagramsService } from './diagrams.service';
import type { PreHandler } from '../auth/auth.middleware';

export function diagramsRoutes(service: DiagramsService, authenticate: PreHandler) {
  return async function (fastify: FastifyInstance): Promise<void> {
    fastify.get('/:issueId', { preHandler: [authenticate] }, async (request) => {
      const { issueId } = validateDto(issueIdParamsSchema, request.params);
      return service.get(request.user.id, issueId);
    });

    fastify.put('/', { preHandler: [authenticate], schema: { body: saveDiagramSchema } }, async (request) => {
      const input = validateDto(saveDiagramSchema, request.body);
      return service.save(request.user.id, input);
    });

    fastify.delete('/:issueId', { preHandler: [authenticate] }, async (request, reply) => {
      const { issueId } = validateDto(issueIdParamsSchema, request.params);
      await service.delete(request.user.id, issueId);
      reply.status(204).send();
    });
  };
}
