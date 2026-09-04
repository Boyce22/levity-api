import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createErrorHandler } from '../../src/shared/error-handler';

test('Fastify schema errors are returned as 422 responses', () => {
  let statusCode = 0;
  let payload: unknown;
  const reply = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    send(value: unknown) {
      payload = value;
      return this;
    },
  } as never;
  const logger = { error() {} } as never;
  const handler = createErrorHandler(logger);

  handler(
    {
      validation: [{ instancePath: '', keyword: 'required', message: "must have required property 'name'", params: { missingProperty: 'name' } }],
    } as never,
    { method: 'POST', url: '/api/example' } as never,
    reply,
  );

  assert.equal(statusCode, 422);
  assert.deepEqual(payload, {
    error: "name: must have required property 'name'",
    code: 'UNPROCESSABLE_ENTITY',
  });
});
