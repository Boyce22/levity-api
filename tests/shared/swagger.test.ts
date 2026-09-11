import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { test } from 'node:test';
import { fastifySwagger } from '@fastify/swagger';
import { swaggerOptions } from '../../src/app';
import { authRoutes } from '../../src/modules/auth/auth.controller';
import { withSwaggerTag } from '../../src/shared/http';

test('Swagger exposes TypeBox request bodies as OpenAPI requestBody schemas', async () => {
  const app = Fastify();
  await app.register(fastifySwagger, {
    openapi: { info: { title: 'test', version: '1.0.0' } },
  });
  await app.register(authRoutes({
    login: async () => ({ ok: true }),
    register: async () => ({ ok: true }),
  } as never));
  await app.ready();

  const document = app.swagger();
  const login = document.paths['/login']?.post as {
    requestBody?: { content?: { 'application/json'?: { schema?: { properties?: Record<string, unknown> } } } };
  };
  assert.ok(login.requestBody);
  assert.ok(login.requestBody.content?.['application/json']?.schema?.properties?.username);
  await app.close();
});

test('Swagger uses JWT bearer authentication and keeps auth endpoints public', async () => {
  const app = Fastify();
  await app.register(fastifySwagger, swaggerOptions);
  await app.register(authRoutes({
    login: async () => ({ ok: true }),
    register: async () => ({ ok: true }),
  } as never));
  await app.ready();

  const document = app.swagger();
  assert.deepEqual(document.security, [{ bearerAuth: [] }]);
  assert.equal(document.components?.securitySchemes?.bearerAuth?.type, 'http');
  assert.equal(document.components?.securitySchemes?.bearerAuth?.scheme, 'bearer');
  assert.deepEqual(document.paths['/login']?.post?.security, []);
  assert.deepEqual(document.paths['/register']?.post?.security, []);
  assert.deepEqual(
    document.tags?.map((tag) => tag.name),
    ['Health', 'Auth', 'Users', 'Workspaces', 'Boards', 'Sprints', 'Comments', 'Diagrams', 'Notifications', 'Files'],
  );
  await app.close();
});

test('Swagger groups routes by resource tag instead of default', async () => {
  const app = Fastify();
  await app.register(fastifySwagger, swaggerOptions);
  await app.register(withSwaggerTag('Auth', authRoutes({
    login: async () => ({ ok: true }),
    register: async () => ({ ok: true }),
  } as never)));
  await app.ready();

  const document = app.swagger();
  assert.deepEqual(document.paths['/login']?.post?.tags, ['Auth']);
  assert.deepEqual(document.paths['/register']?.post?.tags, ['Auth']);
  await app.close();
});
