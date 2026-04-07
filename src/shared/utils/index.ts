import pino from 'pino';
import { ZodSchema } from 'zod';
import { UnprocessableEntityError } from '@errors';

export const logger = pino({
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});

export function validateDto<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new UnprocessableEntityError(message);
  }
  return result.data;
}

export class UUID {
  static generate(): string {
    return crypto.randomUUID();
  }
}
