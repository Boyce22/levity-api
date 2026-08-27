import type { FastifyInstance } from 'fastify';
import { loginSchema, registerSchema } from '@levity/domain';
import { validateDto } from '@levity/observability';
import type { AuthService } from './auth.service';

export function authRoutes(service: AuthService) {
  return async function (fastify: FastifyInstance): Promise<void> {
    fastify.post('/login', async (request) => {
      const { userName, password } = validateDto(loginSchema, request.body);
      return service.login(userName, password);
    });

    fastify.post('/register', async (request, reply) => {
      const { userName, password, email } = validateDto(registerSchema, request.body);
      const data = await service.register(userName, password, email);
      reply.status(201);
      return data;
    });
  };
}
