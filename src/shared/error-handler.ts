import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import type { Logger } from './index';
import { AppError } from './index';

export * from './index';

export type ErrorHandler = (
  err: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
) => void;

interface ValidationIssue {
  instancePath?: string;
  dataPath?: string;
  keyword?: string;
  message?: string;
  params?: { missingProperty?: string };
}

function validationMessage(issues: ValidationIssue[]): string {
  return issues
    .map((issue) => {
      const path = issue.instancePath || issue.dataPath ||
        (issue.params?.missingProperty ? `/${issue.params.missingProperty}` : '');
      return `${path.replace(/^\//, '').split('/').join('.') || 'value'}: ${issue.message ?? 'Validation failed'}`;
    })
    .join(', ');
}

export function createErrorHandler(logger: Logger): ErrorHandler {
  return function errorHandler(err, request, reply): void {
    const validation = (err as FastifyError & { validation?: ValidationIssue[] }).validation;
    if (validation) {
      reply.status(422).send({
        error: validationMessage(validation),
        code: 'UNPROCESSABLE_ENTITY',
      });
      return;
    }

    if (err instanceof AppError) {
      reply.status(err.statusCode).send({ error: err.message, code: err.code });
      return;
    }

    logger.error({ err, method: request.method, url: request.url }, 'Unhandled error');
    reply.status(500).send({ error: 'Internal server error' });
  };
}
