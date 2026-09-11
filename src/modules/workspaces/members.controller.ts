import type { AppInstance } from '../../app';
import { updateMemberRoleSchema, idParamsSchema, memberParamsSchema } from '../../contracts';
import type { MembersService } from './members.service';
import type { PreHandler } from '../auth/auth.middleware';

export function membersRoutes(service: MembersService, authenticate: PreHandler) {
  return async function (fastify: AppInstance): Promise<void> {

    fastify.get('/:id/members', { preHandler: [authenticate], schema: { params: idParamsSchema } }, async (request) => {
      return service.getMembers(request.user.id, request.params.id);
    });

    fastify.patch(
      '/:id/members/:memberId/role',
      { preHandler: [authenticate], schema: { params: memberParamsSchema, body: updateMemberRoleSchema } },
      async (request) => {
        return service.updateMemberRole(request.user.id, request.params.id, request.params.memberId, request.body);
      },
    );

    fastify.delete(
      '/:id/members/:memberId',
      { preHandler: [authenticate], schema: { params: memberParamsSchema } },
      async (request, reply) => {
        await service.removeMember(request.user.id, request.params.id, request.params.memberId);
        reply.status(204).send();
      },
    );
  };
}
