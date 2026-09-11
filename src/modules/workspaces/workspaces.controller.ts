import type { AppInstance } from '../../app';
import {
  createWorkspaceSchema,
  renameWorkspaceSchema,
  createBoardSchema,
  renameBoardSchema,
  generateInviteSchema,
  idParamsSchema,
  tokenParamsSchema,
  inviteParamsSchema,
  workspaceBoardParamsSchema,
} from '../../contracts';
import type { MembersService } from './members.service';
import type { WorkspaceService } from './workspaces.service';
import type { PreHandler } from '../auth/auth.middleware';

export function workspaceRoutes(
  workspaceService: WorkspaceService,
  membersService: MembersService,
  authenticate: PreHandler,
) {
  return async function (fastify: AppInstance): Promise<void> {

    fastify.get('/', { preHandler: [authenticate] }, async (request) => {
      return workspaceService.getWorkspaces(request.user.id);
    });

    fastify.post('/', { preHandler: [authenticate], schema: { body: createWorkspaceSchema } }, async (request, reply) => {
      const data = await workspaceService.create(request.user.id, request.body.name);
      reply.status(201);
      return data;
    });

    fastify.patch(
      '/:id',
      { preHandler: [authenticate], schema: { params: idParamsSchema, body: renameWorkspaceSchema } },
      async (request) => {
        return workspaceService.rename(request.user.id, request.params.id, request.body.name);
      },
    );

    fastify.delete('/:id', { preHandler: [authenticate], schema: { params: idParamsSchema } }, async (request, reply) => {
      await workspaceService.delete(request.user.id, request.params.id);
      reply.status(204).send();
    });

    fastify.get('/:id/boards', { preHandler: [authenticate], schema: { params: idParamsSchema } }, async (request) => {
      return workspaceService.getHomeBoards(request.user.id, request.params.id);
    });

    fastify.post(
      '/:id/boards',
      { preHandler: [authenticate], schema: { params: idParamsSchema, body: createBoardSchema } },
      async (request, reply) => {
        const data = await workspaceService.createBoard(request.user.id, request.params.id, request.body);
        reply.status(201);
        return data;
      },
    );

    fastify.patch(
      '/:id/boards/:boardId',
      { preHandler: [authenticate], schema: { params: workspaceBoardParamsSchema, body: renameBoardSchema } },
      async (request) => {
        return workspaceService.renameBoard(
          request.user.id,
          request.params.id,
          request.params.boardId,
          request.body.name,
        );
      },
    );

    fastify.post(
      '/:id/boards/:boardId/self-grant',
      { preHandler: [authenticate], schema: { params: workspaceBoardParamsSchema } },
      async (request) => {
        return workspaceService.selfGrantBoard(request.user.id, request.params.id, request.params.boardId);
      },
    );

    fastify.get('/:id/invites', { preHandler: [authenticate], schema: { params: idParamsSchema } }, async (request) => {
      return workspaceService.getInvites(request.user.id, request.params.id);
    });

    fastify.post(
      '/:id/invites',
      { preHandler: [authenticate], schema: { params: idParamsSchema, body: generateInviteSchema } },
      async (request, reply) => {
        const data = await membersService.generateInvite(request.user.id, request.params.id, request.body);
        reply.status(201);
        return data;
      },
    );

    fastify.get(
      '/:id/invites/:token',
      { preHandler: [authenticate], schema: { params: tokenParamsSchema } },
      async (request) => {
        return membersService.getInviteDetails(request.params.token);
      },
    );

    fastify.post(
      '/:id/invites/:token/accept',
      { preHandler: [authenticate], schema: { params: tokenParamsSchema } },
      async (request) => {
        return membersService.acceptInvite(request.user.id, request.params.token);
      },
    );

    fastify.delete(
      '/:id/invites/:inviteId',
      { preHandler: [authenticate], schema: { params: inviteParamsSchema } },
      async (request, reply) => {
        await membersService.revokeInvite(request.user.id, request.params.id, request.params.inviteId);
        reply.status(204).send();
      },
    );
  };
}
