import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RATE_LIMIT: z.coerce.number().int().positive().default(100),

  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DB_SCHEMA: z.string().default('public'),

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

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(result.error.format());
    throw new Error('Invalid environment variables');
  }

  return result.data;
};

export const env = parseEnv();
