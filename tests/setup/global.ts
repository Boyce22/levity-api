import { resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { Client } from 'pg';

const TEST_DATABASE = 'levity_test';

function applyTestEnv(): void {
  loadDotenv({ path: resolve(process.cwd(), '.env') });

  process.env.NODE_ENV = 'test';
  process.env.DB_NAME = TEST_DATABASE;
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-at-least-32-chars!!';
  process.env.LOG_LEVEL = 'fatal';
  process.env.STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 's3';
}

function quoteIdent(value: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Invalid database identifier: ${value}`);
  }
  return `"${value}"`;
}

async function ensureDatabase(): Promise<void> {
  const client = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: 'postgres',
  });

  try {
    await client.connect();
  } catch (error) {
    throw new Error(
      'Postgres indisponível. Suba o banco com `docker compose up -d` antes de `npm test`.',
      { cause: error },
    );
  }

  try {
    const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [TEST_DATABASE]);
    if (!existing.rowCount) {
      await client.query(`CREATE DATABASE ${quoteIdent(TEST_DATABASE)}`);
    }
  } finally {
    await client.end();
  }
}

export default async function setup(): Promise<void> {
  applyTestEnv();
  await ensureDatabase();

  const { AppDataSource } = await import('../../src/db/data-source');
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  await AppDataSource.runMigrations();
  await AppDataSource.destroy();
}
