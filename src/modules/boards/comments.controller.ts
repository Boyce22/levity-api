import type { AppInstance } from '../../app';
import { createCommentSchema, updateCommentSchema, queryCommentsSchema, idParamsSchema } from '../../contracts';
import type { CommentsService } from './comments.service';
import type { PreHandler } from '../auth/auth.middleware';

export function commentsRoutes(service: CommentsService, authenticate: PreHandler) {
  return async function (fastify: AppInstance): Promise<void> {

    fastify.get(
      '/:id/replies',
      { preHandler: [authenticate], schema: { params: idParamsSchema } },
      async (request) => {
        return service.getReplies(request.user.id, request.params.id);
      },
    );

    fastify.get('/', { preHandler: [authenticate], schema: { querystring: queryCommentsSchema } }, async (request) => {
      return service.getComments(request.user.id, request.query);
    });

    fastify.post('/', { preHandler: [authenticate], schema: { body: createCommentSchema } }, async (request, reply) => {
      const data = await service.create(request.user.id, request.body);
      reply.status(201);
      return data;
    });

    fastify.patch(
      '/:id',
      { preHandler: [authenticate], schema: { params: idParamsSchema, body: updateCommentSchema } },
      async (request) => {
        return service.update(request.user.id, request.params.id, request.body);
      },
    );

    fastify.delete('/:id', { preHandler: [authenticate], schema: { params: idParamsSchema } }, async (request, reply) => {
      await service.delete(request.user.id, request.params.id);
      reply.status(204).send();
    });
  };
}
