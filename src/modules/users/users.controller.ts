import type { FastifyInstance } from 'fastify';
import { updateUserSchema, queryUsersSchema } from '../../contracts';
import { validateDto } from '../../shared/http';
import type { UsersService } from './users.service';
import type { PreHandler } from '../auth/auth.middleware';

export function usersRoutes(service: UsersService, authenticate: PreHandler) {
  return async function (fastify: FastifyInstance): Promise<void> {
    fastify.get('/me', { preHandler: [authenticate] }, async (request) => {
      return service.getProfile(request.user.id);
    });

    fastify.patch('/me', { preHandler: [authenticate], schema: { body: updateUserSchema } }, async (request) => {
      const input = validateDto(updateUserSchema, request.body);
      return service.updateProfile(request.user.id, input);
    });

    fastify.get('/', { preHandler: [authenticate], schema: { querystring: queryUsersSchema } }, async (request) => {
      const { workspace_id, search } = validateDto(queryUsersSchema, request.query);
      if (!workspace_id) return [];
      return service.getUsersByWorkspace(workspace_id, search);
    });
  };
}
