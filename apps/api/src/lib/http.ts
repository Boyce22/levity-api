import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
export { validateDto } from '../observability';
export { createErrorHandler, type ErrorHandler } from './errors';

export type ApiPlugin = FastifyPluginAsync;

export async function registerPlugin(
  fastify: FastifyInstance,
  plugin: ApiPlugin,
  prefix: string,
): Promise<void> {
  await fastify.register(plugin, { prefix });
}
