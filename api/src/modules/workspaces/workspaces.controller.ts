import type { FastifyInstance } from 'fastify';
import { createWorkspaceSchema, renameWorkspaceSchema, generateInviteSchema } from '../../domain';
import { validateDto } from '../../shared/http';
import type { MembersService } from './members.service';
import type { WorkspaceService } from './workspaces.service';
import type { PreHandler } from '../auth/auth.middleware';

export function workspaceRoutes(
  workspaceService: WorkspaceService,
  membersService: MembersService,
  authenticate: PreHandler,
) {
  return async function (fastify: FastifyInstance): Promise<void> {
    fastify.get('/', { preHandler: [authenticate] }, async (request) => {
      return workspaceService.getWorkspaces(request.user.id);
    });

    fastify.post('/', { preHandler: [authenticate] }, async (request, reply) => {
      const { name } = validateDto(createWorkspaceSchema, request.body);
      const data = await workspaceService.create(request.user.id, name);
      reply.status(201);
      return data;
    });

    fastify.patch('/:id', { preHandler: [authenticate] }, async (request) => {
      const { id } = request.params as { id: string };
      const { name } = validateDto(renameWorkspaceSchema, request.body);
      return workspaceService.rename(request.user.id, id, name);
    });

    fastify.delete('/:id', { preHandler: [authenticate] }, async (request, reply) => {
      const { id } = request.params as { id: string };
      await workspaceService.delete(request.user.id, id);
      reply.status(204).send();
    });

    fastify.get('/:id/invites', { preHandler: [authenticate] }, async (request) => {
      const { id } = request.params as { id: string };
      return workspaceService.getInvites(request.user.id, id);
    });

    fastify.post('/:id/invites', { preHandler: [authenticate] }, async (request, reply) => {
      const { id } = request.params as { id: string };
      const input = validateDto(generateInviteSchema, request.body);
      const data = await membersService.generateInvite(request.user.id, id, input);
      reply.status(201);
      return data;
    });

    fastify.get('/:id/invites/:token', { preHandler: [authenticate] }, async (request) => {
      const { token } = request.params as { token: string };
      return membersService.getInviteDetails(token);
    });

    fastify.post('/:id/invites/:token/accept', { preHandler: [authenticate] }, async (request) => {
      const { token } = request.params as { token: string };
      return membersService.acceptInvite(request.user.id, token);
    });

    fastify.delete('/:id/invites/:inviteId', { preHandler: [authenticate] }, async (request, reply) => {
      const { id, inviteId } = request.params as { id: string; inviteId: string };
      await membersService.revokeInvite(request.user.id, id, inviteId);
      reply.status(204).send();
    });
  };
}
