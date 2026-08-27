import type { FastifyInstance } from 'fastify';
import { updateUserSchema, queryUsersSchema } from '@levity/domain';
import { validateDto } from '@levity/observability';
import type { UsersService } from '@levity/application';
import type { PreHandler } from '../auth/auth.middleware';

export function usersRoutes(service: UsersService, authenticate: PreHandler) {
  return async function (fastify: FastifyInstance): Promise<void> {
    fastify.get('/me', { preHandler: [authenticate] }, async (request) => {
      return service.getProfile(request.user.id);
    });

    fastify.patch('/me', { preHandler: [authenticate] }, async (request) => {
      const input = validateDto(updateUserSchema, request.body);
      return service.updateProfile(request.user.id, input);
    });

    fastify.get('/', { preHandler: [authenticate] }, async (request) => {
      const { workspace_id } = validateDto(queryUsersSchema, request.query);
      if (!workspace_id) return [];
      return service.getUsersByWorkspace(workspace_id);
    });
  };
}
