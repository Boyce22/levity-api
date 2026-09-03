import type { FastifyInstance } from 'fastify';
import { createCommentSchema, updateCommentSchema, queryCommentsSchema } from '../../domain';
import { validateDto } from '../../shared/http';
import type { CommentsService } from './comments.service';
import type { PreHandler } from '../auth/auth.middleware';

export function commentsRoutes(service: CommentsService, authenticate: PreHandler) {
  return async function (fastify: FastifyInstance): Promise<void> {
    fastify.get('/:id/replies', { preHandler: [authenticate] }, async (request) => {
      const { id } = request.params as { id: string };
      return service.getReplies(request.user.id, id);
    });

    fastify.get('/', { preHandler: [authenticate] }, async (request) => {
      const query = validateDto(queryCommentsSchema, request.query);
      return service.getComments(request.user.id, query);
    });

    fastify.post('/', { preHandler: [authenticate] }, async (request, reply) => {
      const input = validateDto(createCommentSchema, request.body);
      const data = await service.create(request.user.id, input);
      reply.status(201);
      return data;
    });

    fastify.patch('/:id', { preHandler: [authenticate] }, async (request) => {
      const { id } = request.params as { id: string };
      const input = validateDto(updateCommentSchema, request.body);
      return service.update(request.user.id, id, input);
    });

    fastify.delete('/:id', { preHandler: [authenticate] }, async (request, reply) => {
      const { id } = request.params as { id: string };
      await service.delete(request.user.id, id);
      reply.status(204).send();
    });
  };
}
