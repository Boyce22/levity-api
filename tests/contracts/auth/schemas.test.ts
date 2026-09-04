import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loginSchema, registerSchema } from '../../../src/contracts/auth/schemas';
import { validateDto } from '../../../src/shared/validate-schema';

test('loginSchema accepts a valid payload', () => {
  const result = validateDto(loginSchema, { username: 'ada', password: 'secret' });
  assert.equal(result.username, 'ada');
});

test('loginSchema rejects a short username', () => {
  assert.throws(() => validateDto(loginSchema, { username: 'ab', password: 'secret' }));
});

test('registerSchema accepts optional email', () => {
  const result = validateDto(registerSchema, { username: 'ada', password: 'secret' });
  assert.equal(result.email, undefined);
});

test('registerSchema rejects invalid email', () => {
  assert.throws(() => validateDto(registerSchema, {
    username: 'ada', password: 'secret', email: 'not-an-email',
  }));
});
