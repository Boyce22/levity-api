import { describe, expect, it } from 'vitest';
import './setup';
import { api } from '../helpers/http';
import { registrarUsuario, unique } from '../helpers/factories';

describe('POST /api/auth/register', () => {
  it('cria a conta e devolve o token de acesso quando os dados são válidos', async () => {
    const username = unique('ada');
    const response = await api<{ accessToken: string; user: { id: string; username: string } }>(
      'POST',
      '/api/auth/register',
      { body: { username, password: 'secret1', email: `${username}@levity.test` } },
    );

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toBeTruthy();
    expect(response.body.user.username).toBe(username);
  });

  it('rejeita o cadastro quando o username já está em uso', async () => {
    const user = await registrarUsuario();
    const response = await api('POST', '/api/auth/register', {
      body: { username: user.username, password: 'secret1' },
    });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ code: 'CONFLICT' });
  });

  it('rejeita o corpo quando o username é curto demais', async () => {
    const response = await api('POST', '/api/auth/register', {
      body: { username: 'ab', password: 'secret1' },
    });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ code: 'UNPROCESSABLE_ENTITY' });
  });
});

describe('POST /api/auth/login', () => {
  it('autentica o usuário e devolve o accessToken quando as credenciais são válidas', async () => {
    const user = await registrarUsuario();
    const response = await api<{ accessToken: string; user: { username: string } }>('POST', '/api/auth/login', {
      body: { username: user.username, password: user.password },
    });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeTruthy();
    expect(response.body.user.username).toBe(user.username);
  });

  it('recusa o login quando a senha está incorreta', async () => {
    const user = await registrarUsuario();
    const response = await api('POST', '/api/auth/login', {
      body: { username: user.username, password: 'wrong1' },
    });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('recusa o login quando o usuário não existe', async () => {
    const response = await api('POST', '/api/auth/login', {
      body: { username: unique('ghost'), password: 'secret1' },
    });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('rejeita o corpo quando falta a senha', async () => {
    const response = await api('POST', '/api/auth/login', {
      body: { username: 'ada' },
    });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ code: 'UNPROCESSABLE_ENTITY' });
  });
});
