import type { AppInstance } from '../../app';
import { loginSchema, registerSchema } from '../../contracts';
import type { AuthService } from './auth.service';

export function authRoutes(service: AuthService) {
  return async function (fastify: AppInstance): Promise<void> {
    fastify.post('/login', { schema: { body: loginSchema, security: [] } }, async (request) => {
      const { username, password } = request.body;
      return service.login(username, password);
    });

    fastify.post('/register', { schema: { body: registerSchema, security: [] } }, async (request, reply) => {
      const { username, password, email } = request.body;
      const data = await service.register(username, password, email);
      reply.status(201);
      return data;
    });
  };
}
