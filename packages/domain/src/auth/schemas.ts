import { z } from 'zod';

export const loginSchema = z.object({
  userName: z.string().min(3),
  password: z.string().min(5),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  userName: z.string().min(3).max(30),
  password: z.string().min(5),
  email: z.email().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
