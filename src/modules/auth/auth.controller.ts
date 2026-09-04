import type { FastifyInstance } from 'fastify';
import { loginSchema, registerSchema } from '../../contracts';
import { validateDto } from '../../shared/http';
import type { AuthService } from './auth.service';

export function authRoutes(service: AuthService) {
  return async function (fastify: FastifyInstance): Promise<void> {
    fastify.post('/login', { schema: { body: loginSchema, security: [] } }, async (request) => {
      const { username, password } = validateDto(loginSchema, request.body);
      return service.login(username, password);
    });

    fastify.post('/register', { schema: { body: registerSchema, security: [] } }, async (request, reply) => {
      const { username, password, email } = validateDto(registerSchema, request.body);
      const data = await service.register(username, password, email);
      reply.status(201);
      return data;
    });
  };
}
