import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { loginSchema, registerSchema } from '../../../src/contracts/auth/schemas';
import { validateDto } from '../../../src/shared/validate-schema';

describe('auth schemas', () => {
  it('loginSchema accepts a valid payload', () => {
    const result = validateDto(loginSchema, { username: 'ada', password: 'secret' });
    assert.equal(result.username, 'ada');
  });

  it('loginSchema rejects a short username', () => {
    assert.throws(() => validateDto(loginSchema, { username: 'ab', password: 'secret' }));
  });

  it('registerSchema accepts optional email', () => {
    const result = validateDto(registerSchema, { username: 'ada', password: 'secret' });
    assert.equal(result.email, undefined);
  });
});
