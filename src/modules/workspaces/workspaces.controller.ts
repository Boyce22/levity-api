import type { FastifyInstance } from 'fastify';
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

    fastify.post('/', { preHandler: [authenticate], schema: { body: createWorkspaceSchema } }, async (request, reply) => {
      const { name } = validateDto(createWorkspaceSchema, request.body);
      const data = await workspaceService.create(request.user.id, name);
      reply.status(201);
      return data;
    });

    fastify.patch('/:id', { preHandler: [authenticate], schema: { body: renameWorkspaceSchema } }, async (request) => {
      const { id } = validateDto(idParamsSchema, request.params);
      const { name } = validateDto(renameWorkspaceSchema, request.body);
      return workspaceService.rename(request.user.id, id, name);
    });

    fastify.delete('/:id', { preHandler: [authenticate] }, async (request, reply) => {
      const { id } = validateDto(idParamsSchema, request.params);
      await workspaceService.delete(request.user.id, id);
      reply.status(204).send();
    });

    fastify.get('/:id/boards', { preHandler: [authenticate] }, async (request) => {
      const { id } = validateDto(idParamsSchema, request.params);
      return workspaceService.getHomeBoards(request.user.id, id);
    });

    fastify.post('/:id/boards', { preHandler: [authenticate], schema: { body: createBoardSchema } }, async (request, reply) => {
      const { id } = validateDto(idParamsSchema, request.params);
      const input = validateDto(createBoardSchema, request.body);
      const data = await workspaceService.createBoard(request.user.id, id, input);
      reply.status(201);
      return data;
    });

    fastify.patch('/:id/boards/:boardId', { preHandler: [authenticate], schema: { body: renameBoardSchema } }, async (request) => {
      const { id, boardId } = validateDto(workspaceBoardParamsSchema, request.params);
      const { name } = validateDto(renameBoardSchema, request.body);
      return workspaceService.renameBoard(request.user.id, id, boardId, name);
    });

    fastify.post('/:id/boards/:boardId/self-grant', { preHandler: [authenticate] }, async (request) => {
      const { id, boardId } = validateDto(workspaceBoardParamsSchema, request.params);
      return workspaceService.selfGrantBoard(request.user.id, id, boardId);
    });

    fastify.get('/:id/invites', { preHandler: [authenticate] }, async (request) => {
      const { id } = validateDto(idParamsSchema, request.params);
      return workspaceService.getInvites(request.user.id, id);
    });

    fastify.post('/:id/invites', { preHandler: [authenticate], schema: { body: generateInviteSchema } }, async (request, reply) => {
      const { id } = validateDto(idParamsSchema, request.params);
      const input = validateDto(generateInviteSchema, request.body);
      const data = await membersService.generateInvite(request.user.id, id, input);
      reply.status(201);
      return data;
    });

    fastify.get('/:id/invites/:token', { preHandler: [authenticate] }, async (request) => {
      const { token } = validateDto(tokenParamsSchema, request.params);
      return membersService.getInviteDetails(token);
    });

    fastify.post('/:id/invites/:token/accept', { preHandler: [authenticate] }, async (request) => {
      const { token } = validateDto(tokenParamsSchema, request.params);
      return membersService.acceptInvite(request.user.id, token);
    });

    fastify.delete('/:id/invites/:inviteId', { preHandler: [authenticate] }, async (request, reply) => {
      const { id, inviteId } = validateDto(inviteParamsSchema, request.params);
      await membersService.revokeInvite(request.user.id, id, inviteId);
      reply.status(204).send();
    });
  };
}
