import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui'; 

import { env } from './config';
import { MAX_IMAGE_SIZE_BYTES } from './contracts';
import type { ApiContainer } from './composition';
import { createErrorHandler } from './shared/http';
import { buildRoutes } from './routes';

export async function buildApp(container: ApiContainer): Promise<FastifyInstance> {
  const { logger } = container;

  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
    trustProxy: true,
    bodyLimit: MAX_IMAGE_SIZE_BYTES,
  });

  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Levity API',
        description: 'Documentation for the Levity API',
        version: '0.1.0',
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`,
          description: 'Local development server',
        },
      ],
    },
  });

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
    limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
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

  fastify.get('/health', async () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  }));

  fastify.get('/', async () => ({
    name: 'Levity API',
    version: '1.0.0',
    endpoints: { health: '/health', api: '/api' },
  }));

  await fastify.register(buildRoutes(container), { prefix: '/api' });

  return fastify;
}
