import type { AppInstance } from './app';
import type { ApiContainer } from './composition';
import { withSwaggerTag } from './shared/http';

export function buildRoutes(container: ApiContainer) {
  const { plugins } = container;

  return async function routes(fastify: AppInstance): Promise<void> {
    await fastify.register(withSwaggerTag('Auth', plugins.auth), { prefix: '/auth' });
    await fastify.register(withSwaggerTag('Users', plugins.users), { prefix: '/users' });
    await fastify.register(withSwaggerTag('Workspaces', plugins.workspaces), { prefix: '/workspaces' });
    await fastify.register(withSwaggerTag('Workspaces', plugins.members), { prefix: '/workspaces' });
    await fastify.register(withSwaggerTag('Workspaces', plugins.settings), { prefix: '/workspaces' });
    await fastify.register(withSwaggerTag('Boards', plugins.board), { prefix: '/boards' });
    await fastify.register(withSwaggerTag('Sprints', plugins.sprints), { prefix: '/boards' });
    await fastify.register(withSwaggerTag('Comments', plugins.comments), { prefix: '/comments' });
    await fastify.register(withSwaggerTag('Notifications', plugins.notifications), { prefix: '/notifications' });
    await fastify.register(withSwaggerTag('Diagrams', plugins.diagrams), { prefix: '/diagrams' });
    await fastify.register(withSwaggerTag('Files', plugins.files), { prefix: '/files' });
  };
}
