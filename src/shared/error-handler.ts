import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import type { Logger } from './index';
import { AppError } from './index';

export * from './index';

export type ErrorHandler = (
  err: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
) => void;

export function createErrorHandler(logger: Logger): ErrorHandler {
  return function errorHandler(err, request, reply): void {
    if (err instanceof AppError) {
      reply.status(err.statusCode).send({ error: err.message, code: err.code });
      return;
    }

    logger.error({ err, method: request.method, url: request.url }, 'Unhandled error');
    reply.status(500).send({ error: 'Internal server error' });
  };
}
