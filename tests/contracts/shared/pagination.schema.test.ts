import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { paginationSchema } from '../../../src/contracts/shared/pagination.schema';
import { validateDto } from '../../../src/shared/validate-schema';

describe('pagination schema', () => {
  it('paginationSchema applies defaults', () => {
    const result = validateDto(paginationSchema, {});
    assert.equal(result.page, 1);
    assert.equal(result.limit, 20);
  });

  it('paginationSchema rejects limit above max', () => {
    assert.throws(() => validateDto(paginationSchema, { limit: 101 }));
  });
});
