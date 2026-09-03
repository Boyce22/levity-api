import assert from 'node:assert/strict';
import { test } from 'node:test';
import { paginationSchema } from './pagination.schema';

test('paginationSchema applies defaults', () => {
  const result = paginationSchema.parse({});
  assert.equal(result.page, 1);
  assert.equal(result.limit, 20);
});

test('paginationSchema coerces query strings', () => {
  const result = paginationSchema.parse({ page: '2', limit: '50' });
  assert.equal(result.page, 2);
  assert.equal(result.limit, 50);
});

test('paginationSchema rejects limit above max', () => {
  const result = paginationSchema.safeParse({ limit: 101 });
  assert.equal(result.success, false);
});
