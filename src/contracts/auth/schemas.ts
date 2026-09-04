import { Type, type Static } from '@sinclair/typebox';
import { emailSchema } from '../shared/typebox';

export const loginSchema = Type.Object({
  username: Type.String({ minLength: 3 }),
  password: Type.String({ minLength: 5 }),
});

export type LoginInput = Static<typeof loginSchema>;

export const registerSchema = Type.Object({
  username: Type.String({ minLength: 3, maxLength: 30 }),
  password: Type.String({ minLength: 5 }),
  email: Type.Optional(emailSchema),
});

export type RegisterInput = Static<typeof registerSchema>;
