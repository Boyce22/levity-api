import { type ZodType, type z } from 'zod';
import { UnprocessableEntityError } from './errors/index';

export function validateDto<S extends ZodType>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
    throw new UnprocessableEntityError(message);
  }
  return result.data;
}
