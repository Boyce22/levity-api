import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
export { validateDto } from './index';
export { createErrorHandler, type ErrorHandler } from './error-handler';

export type ApiPlugin = FastifyPluginAsync;

export function withSwaggerTag<T extends FastifyInstance>(
  tag: string,
  plugin: (fastify: T) => Promise<void>,
): (fastify: T) => Promise<void> {
  return async function taggedPlugin(fastify: T) {
    fastify.addHook('onRoute', (route) => {
      route.schema = {
        ...route.schema,
        tags: Array.from(new Set([...(route.schema?.tags ?? []), tag])),
      };
    });
    await plugin(fastify);
  };
}

export async function registerPlugin(
  fastify: FastifyInstance,
  plugin: ApiPlugin,
  prefix: string,
): Promise<void> {
  await fastify.register(plugin, { prefix });
}
