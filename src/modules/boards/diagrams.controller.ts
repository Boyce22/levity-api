import type { AppInstance } from '../../app';
import { saveDiagramSchema, issueIdParamsSchema } from '../../contracts';
import type { DiagramsService } from './diagrams.service';
import type { PreHandler } from '../auth/auth.middleware';

export function diagramsRoutes(service: DiagramsService, authenticate: PreHandler) {
  return async function (fastify: AppInstance): Promise<void> {

    fastify.get('/:issueId', { preHandler: [authenticate], schema: { params: issueIdParamsSchema } }, async (request) => {
      return service.get(request.user.id, request.params.issueId);
    });

    fastify.put('/', { preHandler: [authenticate], schema: { body: saveDiagramSchema } }, async (request) => {
      return service.save(request.user.id, request.body);
    });

    fastify.delete(
      '/:issueId',
      { preHandler: [authenticate], schema: { params: issueIdParamsSchema } },
      async (request, reply) => {
        await service.delete(request.user.id, request.params.issueId);
        reply.status(204).send();
      },
    );
  };
}
