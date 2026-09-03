import type { FastifyInstance } from 'fastify';
import { queryNotificationsSchema } from '../domain';
import { validateDto } from '../lib/http';
import type { NotificationsService } from './service';
import type { PreHandler } from '../auth/middleware';

export function notificationsRoutes(service: NotificationsService, authenticate: PreHandler) {
  return async function (fastify: FastifyInstance): Promise<void> {
    fastify.get('/', { preHandler: [authenticate] }, async (request) => {
      const query = validateDto(queryNotificationsSchema, request.query);
      return service.getNotifications(request.user.id, query);
    });

    fastify.patch('/:id/read', { preHandler: [authenticate] }, async (request, reply) => {
      const { id } = request.params as { id: string };
      await service.markRead(request.user.id, id);
      reply.status(204).send();
    });

    fastify.post('/read-all', { preHandler: [authenticate] }, async (request, reply) => {
      await service.markAllRead(request.user.id);
      reply.status(204).send();
    });
  };
}
