import rateLimit from 'express-rate-limit';
import { env } from '@config';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
