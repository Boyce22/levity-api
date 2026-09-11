import type { AppInstance } from '../../app';
import { updateUserSchema, queryUsersSchema } from '../../contracts';
import type { UsersService } from './users.service';
import type { PreHandler } from '../auth/auth.middleware';

export function usersRoutes(service: UsersService, authenticate: PreHandler) {
  return async function (fastify: AppInstance): Promise<void> {
    fastify.get('/me', { preHandler: [authenticate] }, async (request) => {
      return service.getProfile(request.user.id);
    });

    fastify.patch('/me', { preHandler: [authenticate], schema: { body: updateUserSchema } }, async (request) => {
      return service.updateProfile(request.user.id, request.body);
    });

    fastify.get('/', { preHandler: [authenticate], schema: { querystring: queryUsersSchema } }, async (request) => {
      const { workspace_id, search } = request.query;
      if (!workspace_id) return [];
      return service.getUsersByWorkspace(workspace_id, search);
    });
  };
}
