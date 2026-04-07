import { z } from 'zod';

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  username: z.string().min(3).max(30),
});

export type RegisterDto = z.infer<typeof registerSchema>;
