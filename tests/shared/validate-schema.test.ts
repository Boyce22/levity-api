import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Type } from '@sinclair/typebox';
import { UnprocessableEntityError } from '../../src/shared/errors';
import { validateDto } from '../../src/shared/validate-schema';

const schema = Type.Object({
  name: Type.String({ minLength: 1 }),
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
