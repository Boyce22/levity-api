import type { FastifyInstance } from 'fastify';
import { updateMemberRoleSchema, idParamsSchema, memberParamsSchema } from '../../contracts';
import { validateDto } from '../../shared/http';
import type { MembersService } from './members.service';
import type { PreHandler } from '../auth/auth.middleware';

export function membersRoutes(service: MembersService, authenticate: PreHandler) {
  return async function (fastify: FastifyInstance): Promise<void> {
    fastify.get('/:id/members', { preHandler: [authenticate] }, async (request) => {
      const { id } = validateDto(idParamsSchema, request.params);
      return service.getMembers(request.user.id, id);
    });

    fastify.patch('/:id/members/:memberId/role', { preHandler: [authenticate] }, async (request) => {
      const { id, memberId } = validateDto(memberParamsSchema, request.params);
      const input = validateDto(updateMemberRoleSchema, request.body);
      return service.updateMemberRole(request.user.id, id, memberId, input);
    });

    fastify.delete('/:id/members/:memberId', { preHandler: [authenticate] }, async (request, reply) => {
      const { id, memberId } = validateDto(memberParamsSchema, request.params);
      await service.removeMember(request.user.id, id, memberId);
      reply.status(204).send();
    });
  };
}
