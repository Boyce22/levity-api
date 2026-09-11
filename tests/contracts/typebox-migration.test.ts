import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createBoardSchema, createTagSchema } from '../../src/contracts/workspaces/schemas';
import { queryNotificationsSchema } from '../../src/contracts/notifications/schemas';
import { validateDto } from '../../src/shared/validate-schema';
import { UnprocessableEntityError } from '../../src/shared/errors';

class ExitSignal extends Error {}

test('TypeBox strips unknown object properties like the previous schemas', () => {
  const result = validateDto(createTagSchema, { name: 'Bug', color: '#abcdef', ignored: true });
  assert.deepEqual(result, { name: 'Bug', color: '#abcdef' });
});

test('createBoardSchema requires a name', () => {
  assert.deepEqual(validateDto(createBoardSchema, { name: 'Roadmap', extra: true }), { name: 'Roadmap' });
});

test('query schemas use JSON Schema integers and booleans for Fastify AJV', () => {
  assert.deepEqual(validateDto(queryNotificationsSchema, { page: 2, limit: 5, read: false }), {
    page: 2,
    limit: 5,
    read: false,
  });
  assert.throws(
    () => validateDto(queryNotificationsSchema, { page: 2.5, limit: 5 }),
    (error: unknown) => error instanceof UnprocessableEntityError,
  );
});

test('environment parsing applies defaults and CORS transformation', async () => {
  process.env.DB_USER = 'test';
  process.env.DB_PASSWORD = 'test';
  process.env.DB_NAME = 'test';
  process.env.JWT_SECRET = 'a'.repeat(32);
  // The module validates process.env at import time; load it only after the required test env exists.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { parseEnv } = require('../../src/config/env');
  const result = parseEnv({
    DB_USER: 'test', DB_PASSWORD: 'test', DB_NAME: 'test',
    JWT_SECRET: 'a'.repeat(32), PORT: '3002', CORS_ORIGIN: ' http://a.test, http://b.test ',
  });
  assert.equal(result.PORT, 3002);
  assert.deepEqual(result.CORS_ORIGIN, ['http://a.test', 'http://b.test']);
  assert.equal(result.DB_PORT, 5432);
});

test('invalid environment parsing exits with code 1', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { parseEnv } = require('../../src/config/env');
  const originalExit = process.exit;
  process.exit = ((code?: number) => { throw new ExitSignal(`exit ${code}`); }) as never;
  try {
    assert.throws(() => parseEnv({}), /exit 1/);
  } finally {
    process.exit = originalExit;
  }
});
