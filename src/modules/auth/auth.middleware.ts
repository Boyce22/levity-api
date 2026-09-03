import type { FastifyRequest, FastifyReply } from 'fastify';
import { TokenExpiredError } from 'jsonwebtoken';
import type { AuthPayload } from '../../contracts';
import { UnauthorizedError } from '../../shared';
import type { AuthService } from './auth.service';

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthPayload;
  }
}

export type PreHandler = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

export function createAuthenticate(authService: AuthService): PreHandler {
  return async function authenticate(request: FastifyRequest): Promise<void> {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = header.slice(7);
    try {
      request.user = authService.verifyAccessToken(token);
    } catch (error) {
      if (error instanceof TokenExpiredError) throw new UnauthorizedError('Invalid or expired token');
      throw new UnauthorizedError('Invalid or expired token');
    }
  };
}
