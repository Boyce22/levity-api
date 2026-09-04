import assert from 'node:assert/strict';
import { test } from 'node:test';
import { paginationSchema } from '../../../src/contracts/shared/pagination.schema';
import { validateDto } from '../../../src/shared/validate-schema';

test('paginationSchema applies defaults', () => {
  const result = validateDto(paginationSchema, {});
  assert.equal(result.page, 1);
  assert.equal(result.limit, 20);
});

test('paginationSchema coerces query strings', () => {
  const result = validateDto(paginationSchema, { page: '2', limit: '50' });
  assert.equal(result.page, 2);
  assert.equal(result.limit, 50);
});

test('paginationSchema rejects limit above max', () => {
  assert.throws(() => validateDto(paginationSchema, { limit: 101 }));
});
