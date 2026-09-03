import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loginSchema, registerSchema } from '../../../src/contracts/auth/schemas';

test('loginSchema accepts a valid payload', () => {
  const result = loginSchema.parse({ username: 'ada', password: 'secret' });
  assert.equal(result.username, 'ada');
});

test('loginSchema rejects a short username', () => {
  const result = loginSchema.safeParse({ username: 'ab', password: 'secret' });
  assert.equal(result.success, false);
});

test('registerSchema accepts optional email', () => {
  const result = registerSchema.parse({ username: 'ada', password: 'secret' });
  assert.equal(result.email, undefined);
});

test('registerSchema rejects invalid email', () => {
  const result = registerSchema.safeParse({
    username: 'ada',
    password: 'secret',
    email: 'not-an-email',
  });
  assert.equal(result.success, false);
});
