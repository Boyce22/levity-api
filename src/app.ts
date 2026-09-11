import Fastify, {
  type FastifyBaseLogger,
  type FastifyInstance,
  type RawReplyDefaultExpression,
  type RawRequestDefaultExpression,
  type RawServerDefault,
} from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

import { env } from './config';
import { MAX_IMAGE_SIZE_BYTES } from './contracts';
import type { ApiContainer } from './composition';
import { createErrorHandler } from './shared/http';
import { buildRoutes } from './routes';

export type AppInstance = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  FastifyBaseLogger,
  TypeBoxTypeProvider
>;

export const swaggerOptions = {
  openapi: {
    info: {
      title: 'Levity API',
      description: 'Documentation for the Levity API',
      version: '0.1.0',
    },
    tags: [
      { name: 'Health', description: 'Liveness and service info' },
      { name: 'Auth', description: 'Login and registration' },
      { name: 'Users', description: 'Current user and workspace people' },
      { name: 'Workspaces', description: 'Tenants, boards, invites, members, tags and priorities' },
      { name: 'Boards', description: 'Columns and issues' },
      { name: 'Sprints', description: 'Sprint overlay on a board' },
      { name: 'Comments', description: 'Issue comments' },
      { name: 'Diagrams', description: 'Issue diagrams' },
      { name: 'Notifications', description: 'Inbox' },
      { name: 'Files', description: 'Avatars, covers and attachments' },
    ],
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http' as const,
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
};

export async function buildApp(container: ApiContainer): Promise<AppInstance> {
  const { logger } = container;

  const fastify = Fastify({
    ajv: {
      customOptions: {
        coerceTypes: true,
      },
      plugins: [require('ajv-formats')],
    },
    logger: {
      level: env.LOG_LEVEL,
    },
    trustProxy: true,
    bodyLimit: MAX_IMAGE_SIZE_BYTES,
  }).withTypeProvider<TypeBoxTypeProvider>();

  await fastify.register(fastifySwagger, swaggerOptions);

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });

  await fastify.register(helmet, { contentSecurityPolicy: env.NODE_ENV === 'production' });
  await fastify.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });
  await fastify.register(compress);
  await fastify.register(multipart, {
    limits: {
      fileSize: MAX_IMAGE_SIZE_BYTES,
    },
  });

  if (env.NODE_ENV === 'production') {
    await fastify.register(rateLimit, {
      max: env.RATE_LIMIT,
      timeWindow: '15 minutes',
      errorResponseBuilder: () => ({ error: 'Too many requests, please try again later.' }),
    });
  }

  fastify.setErrorHandler(createErrorHandler(logger));

  fastify.setNotFoundHandler((request, reply) => {
    logger.warn({ method: request.method, path: request.url }, 'Route not found');
    reply.status(404).send({ message: 'Route not found', path: request.url });
  });

  fastify.get('/health', { schema: { tags: ['Health'], security: [] } }, async () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  }));

  fastify.get('/', { schema: { tags: ['Health'], security: [] } }, async () => ({
    name: 'Levity API',
    version: '1.0.0',
    endpoints: { health: '/health', api: '/api' },
  }));

  await fastify.register(buildRoutes(container), { prefix: '/api' });

  return fastify;
}
