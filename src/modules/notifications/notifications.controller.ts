import type { AppInstance } from '../../app';
import { queryNotificationsSchema, idParamsSchema } from '../../contracts';
import type { NotificationsService } from './notifications.service';
import type { PreHandler } from '../auth/auth.middleware';

export function notificationsRoutes(service: NotificationsService, authenticate: PreHandler) {
  return async function (fastify: AppInstance): Promise<void> {

    fastify.get(
      '/',
      { preHandler: [authenticate], schema: { querystring: queryNotificationsSchema } },
      async (request) => {
        return service.getNotifications(request.user.id, request.query);
      },
    );

    fastify.patch(
      '/:id/read',
      { preHandler: [authenticate], schema: { params: idParamsSchema } },
      async (request, reply) => {
        await service.markRead(request.user.id, request.params.id);
        reply.status(204).send();
      },
    );

    fastify.post('/read-all', { preHandler: [authenticate] }, async (request, reply) => {
      await service.markAllRead(request.user.id);
      reply.status(204).send();
    });
  };
}
