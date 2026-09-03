import type { FastifyInstance } from 'fastify';
import { queryNotificationsSchema, idParamsSchema } from '../../contracts';
import { validateDto } from '../../shared/http';
import type { NotificationsService } from './notifications.service';
import type { PreHandler } from '../auth/auth.middleware';

export function notificationsRoutes(service: NotificationsService, authenticate: PreHandler) {
  return async function (fastify: FastifyInstance): Promise<void> {
    fastify.get('/', { preHandler: [authenticate] }, async (request) => {
      const query = validateDto(queryNotificationsSchema, request.query);
      return service.getNotifications(request.user.id, query);
    });

    fastify.patch('/:id/read', { preHandler: [authenticate] }, async (request, reply) => {
      const { id } = validateDto(idParamsSchema, request.params);
      await service.markRead(request.user.id, id);
      reply.status(204).send();
    });

    fastify.post('/read-all', { preHandler: [authenticate] }, async (request, reply) => {
      await service.markAllRead(request.user.id);
      reply.status(204).send();
    });
  };
}
