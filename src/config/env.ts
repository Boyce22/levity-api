import './load-env';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  RUNTIME_ROLE: z.enum(['api', 'db-bootstrap']).default('api'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3000')
    .transform((val) =>
      val
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  RATE_LIMIT: z.coerce.number().int().positive().default(100),

  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DB_SCHEMA: z.string().default('public'),
  DB_POOL_MAX: z.coerce.number().int().positive().optional(),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),

  STORAGE_PROVIDER: z.enum(['backblaze', 's3', 'cloudinary']).default('backblaze'),

  BACKBLAZE_KEY_ID: z.string().optional(),
  BACKBLAZE_APP_KEY: z.string().optional(),
  BACKBLAZE_BUCKET_ID: z.string().optional(),
  BACKBLAZE_BUCKET_NAME: z.string().optional(),
  BACKBLAZE_DOWNLOAD_URL: z.string().optional(),

  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
export type RuntimeRole = Env['RUNTIME_ROLE'];

export const DB_POOL_MAX_BY_ROLE: Record<RuntimeRole, number> = {
  api: 10,
  'db-bootstrap': 2,
};

export function resolveDbPoolMax(role: RuntimeRole = env.RUNTIME_ROLE): number {
  return env.DB_POOL_MAX ?? DB_POOL_MAX_BY_ROLE[role];
}
