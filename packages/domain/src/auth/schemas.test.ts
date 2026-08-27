import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loginSchema, registerSchema } from './schemas';

test('loginSchema accepts a valid payload', () => {
  const result = loginSchema.parse({ userName: 'ada', password: 'secret' });
  assert.equal(result.userName, 'ada');
});

test('loginSchema rejects a short username', () => {
  const result = loginSchema.safeParse({ userName: 'ab', password: 'secret' });
  assert.equal(result.success, false);
});

test('registerSchema accepts optional email', () => {
  const result = registerSchema.parse({ userName: 'ada', password: 'secret' });
  assert.equal(result.email, undefined);
});

test('registerSchema rejects invalid email', () => {
  const result = registerSchema.safeParse({
    userName: 'ada',
    password: 'secret',
    email: 'not-an-email',
  });
  assert.equal(result.success, false);
});
