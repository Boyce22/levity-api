import type { FastifyInstance } from 'fastify';
import type { ApiContainer } from '../composition-root';

export function buildRoutes(container: ApiContainer) {
  const { plugins } = container;

  return async function routes(fastify: FastifyInstance): Promise<void> {
    await fastify.register(plugins.auth, { prefix: '/auth' });
    await fastify.register(plugins.users, { prefix: '/users' });
    await fastify.register(plugins.workspaces, { prefix: '/workspaces' });
    await fastify.register(plugins.members, { prefix: '/workspaces' });
    await fastify.register(plugins.settings, { prefix: '/workspaces' });
    await fastify.register(plugins.board, { prefix: '/workspaces' });
    await fastify.register(plugins.sprints, { prefix: '/workspaces' });
    await fastify.register(plugins.comments, { prefix: '/comments' });
    await fastify.register(plugins.notifications, { prefix: '/notifications' });
    await fastify.register(plugins.diagrams, { prefix: '/diagrams' });
    await fastify.register(plugins.files, { prefix: '/files' });
  };
}
