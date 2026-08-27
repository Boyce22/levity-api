import assert from 'node:assert/strict';
import { test } from 'node:test';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '@levity/observability';
import { type AuthService } from './auth.service';
import { createAuthenticate } from './auth.middleware';

const secret = 'test-secret-test-secret-test-secret';

function fakeAuthService(): AuthService {
  return {
    verifyAccessToken(token: string) {
      return jwt.verify(token, secret) as { id: string; username: string };
    },
  } as AuthService;
}

test('authenticate attaches the JWT payload to the request', async () => {
  const authenticate = createAuthenticate(fakeAuthService());
  const token = jwt.sign({ id: 'user-1', username: 'ada' }, secret);
  const request: { headers: { authorization: string }; user?: { id: string; username: string } } = {
    headers: { authorization: `Bearer ${token}` },
  };
  await authenticate(request as never, {} as never);
  assert.equal(request.user?.id, 'user-1');
  assert.equal(request.user?.username, 'ada');
});

test('authenticate rejects a missing bearer header', async () => {
  const authenticate = createAuthenticate(fakeAuthService());
  await assert.rejects(
    () => authenticate({ headers: {} } as never, {} as never),
    (error: unknown) => error instanceof UnauthorizedError,
  );
});

test('authenticate rejects an invalid token', async () => {
  const authenticate = createAuthenticate(fakeAuthService());
  await assert.rejects(
    () =>
      authenticate(
        { headers: { authorization: 'Bearer not-a-token' } } as never,
        {} as never,
      ),
    (error: unknown) => error instanceof UnauthorizedError,
  );
});
