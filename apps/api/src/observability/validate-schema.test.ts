import assert from 'node:assert/strict';
import { test } from 'node:test';
import { z } from 'zod';
import { UnprocessableEntityError } from './errors';
import { validateDto } from './validate-schema';

const schema = z.object({
  name: z.string().min(1),
});

test('validateDto returns parsed data', () => {
  const result = validateDto(schema, { name: 'levity' });
  assert.equal(result.name, 'levity');
});

test('validateDto throws UnprocessableEntityError on invalid input', () => {
  assert.throws(
    () => validateDto(schema, { name: '' }),
    (error: unknown) => {
      assert.ok(error instanceof UnprocessableEntityError);
      assert.equal(error.statusCode, 422);
      assert.equal(error.code, 'UNPROCESSABLE_ENTITY');
      return true;
    },
  );
});
