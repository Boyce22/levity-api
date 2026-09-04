import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTagSchema } from '../../src/contracts/workspaces/schemas';
import { queryNotificationsSchema } from '../../src/contracts/notifications/schemas';
import { saveDiagramSchema } from '../../src/contracts/diagrams/schemas';
import { validateDto } from '../../src/shared/validate-schema';
import { UnprocessableEntityError } from '../../src/shared/errors';

class ExitSignal extends Error {}

const id = '00000000-0000-0000-0000-000000000000';

test('TypeBox strips unknown object properties like the previous schemas', () => {
  const result = validateDto(createTagSchema, { name: 'Bug', color: '#abcdef', ignored: true });
  assert.deepEqual(result, { name: 'Bug', color: '#abcdef' });
});

test('query coercion is explicit and rejects fractional integers', () => {
  assert.deepEqual(validateDto(queryNotificationsSchema, { page: '2', limit: '5', read: 'false' }), {
    page: 2,
    limit: 5,
    read: false,
  });
  assert.throws(
    () => validateDto(queryNotificationsSchema, { page: '2.5', limit: '5' }),
    (error: unknown) => error instanceof UnprocessableEntityError,
  );
});

test('boolean query accepts only true and false strings', () => {
  assert.throws(() => validateDto(queryNotificationsSchema, { read: '1' }));
});

test('UUID, nested arrays and array limits are validated', () => {
  const result = validateDto(saveDiagramSchema, { card_id: id, data: { elements: [] } });
  assert.equal(result.card_id, id);
  assert.throws(() => validateDto(saveDiagramSchema, { card_id: 'invalid', data: { elements: [] } }));
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
