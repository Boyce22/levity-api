import './load-env';
import { Type, type StaticDecode } from '@sinclair/typebox';
import { AssertError, Value } from '@sinclair/typebox/value';
import { coerceNumberSchema } from '../contracts/shared/typebox';

const envSchema = Type.Object({
  NODE_ENV: Type.Union([Type.Literal('development'), Type.Literal('production'), Type.Literal('test')], { default: 'development' }),
  RUNTIME_ROLE: Type.Union([Type.Literal('api'), Type.Literal('db-bootstrap')], { default: 'api' }),
  PORT: coerceNumberSchema({ integer: true, min: 1, max: 65535, defaultValue: 3001 }),
  LOG_LEVEL: Type.Union([
    Type.Literal('fatal'), Type.Literal('error'), Type.Literal('warn'),
    Type.Literal('info'), Type.Literal('debug'), Type.Literal('trace'),
  ], { default: 'info' }),
  CORS_ORIGIN: Type.Transform(Type.String({ default: 'http://localhost:3000' }))
    .Decode((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean))
    .Encode((value) => value.join(',')),
  RATE_LIMIT: coerceNumberSchema({ integer: true, positive: true, defaultValue: 100 }),

  DB_HOST: Type.String({ default: 'localhost' }),
  DB_PORT: coerceNumberSchema({ integer: true, positive: true, defaultValue: 5432 }),
  DB_USER: Type.String(),
  DB_PASSWORD: Type.String(),
  DB_NAME: Type.String(),
  DB_SCHEMA: Type.String({ default: 'public' }),
  DB_POOL_MAX: Type.Optional(coerceNumberSchema({ integer: true, positive: true })),

  JWT_SECRET: Type.String({ minLength: 32 }),
  JWT_EXPIRES_IN: Type.String({ default: '24h' }),

  STORAGE_PROVIDER: Type.Enum({ backblaze: 'backblaze', s3: 's3', cloudinary: 'cloudinary' }, { default: 'backblaze' }),

  BACKBLAZE_KEY_ID: Type.Optional(Type.String()),
  BACKBLAZE_APP_KEY: Type.Optional(Type.String()),
  BACKBLAZE_BUCKET_ID: Type.Optional(Type.String()),
  BACKBLAZE_BUCKET_NAME: Type.Optional(Type.String()),
  BACKBLAZE_DOWNLOAD_URL: Type.Optional(Type.String()),

  AWS_REGION: Type.Optional(Type.String()),
  AWS_S3_BUCKET: Type.Optional(Type.String()),
  AWS_ACCESS_KEY_ID: Type.Optional(Type.String()),
  AWS_SECRET_ACCESS_KEY: Type.Optional(Type.String()),

  CLOUDINARY_CLOUD_NAME: Type.Optional(Type.String()),
  CLOUDINARY_API_KEY: Type.Optional(Type.String()),
  CLOUDINARY_API_SECRET: Type.Optional(Type.String()),
});

export type Env = StaticDecode<typeof envSchema>;

export function parseEnv(source: NodeJS.ProcessEnv): Env {
  try {
    return Value.Parse(['Clone', 'Clean', 'Default', 'Assert', 'Decode'], envSchema, source) as Env;
  } catch (error) {
    console.error('Invalid environment variables:');
    if (error instanceof AssertError) {
      console.error([...error.Errors()].map((issue) => ({
        field: issue.path.replace(/^\//, '').split('/').join('.'),
        message: issue.message,
      })));
    } else {
      console.error(error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}

export const env = parseEnv(process.env);
export type RuntimeRole = Env['RUNTIME_ROLE'];

export const DB_POOL_MAX_BY_ROLE: Record<RuntimeRole, number> = {
  api: 10,
  'db-bootstrap': 2,
};

export function resolveDbPoolMax(role: RuntimeRole = env.RUNTIME_ROLE): number {
  return env.DB_POOL_MAX ?? DB_POOL_MAX_BY_ROLE[role];
}
