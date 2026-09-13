import { describe, expect, it } from 'vitest';
import './setup';
import { api } from '../helpers/http';
import { contextoOwner, registrarUsuario } from '../helpers/factories';

describe('GET /api/users/me', () => {
  it('devolve o perfil do usuário autenticado', async () => {
    const user = await registrarUsuario();
    const response = await api<{ id: string; username: string }>('GET', '/api/users/me', { token: user.token });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(user.user.id);
    expect(response.body.username).toBe(user.username);
  });

  it('bloqueia o acesso sem token', async () => {
    const response = await api('GET', '/api/users/me');
    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ code: 'UNAUTHORIZED' });
  });
});

describe('PATCH /api/users/me', () => {
  it('atualiza os campos do perfil informados', async () => {
    const user = await registrarUsuario();
    const response = await api<{ first_name: string; bio: string }>('PATCH', '/api/users/me', {
      token: user.token,
      body: { first_name: 'Ada', bio: 'Matemática' },
    });

    expect(response.status).toBe(200);
    expect(response.body.first_name).toBe('Ada');
    expect(response.body.bio).toBe('Matemática');
  });

  it('devolve URL absoluta de avatar sem resolver no storage', async () => {
    const user = await registrarUsuario();
    await api('PATCH', '/api/users/me', {
      token: user.token,
      body: { avatar_url: 'https://cdn.levity.test/ada.png' },
    });
    const response = await api<{ avatar_url?: string }>('GET', '/api/users/me', { token: user.token });
    expect(response.status).toBe(200);
    expect(response.body.avatar_url).toBe('https://cdn.levity.test/ada.png');
  });

  it('rejeita um e-mail inválido', async () => {
    const user = await registrarUsuario();
    const response = await api('PATCH', '/api/users/me', {
      token: user.token,
      body: { email: 'nao-e-email' },
    });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ code: 'UNPROCESSABLE_ENTITY' });
  });

  it('bloqueia a edição sem token', async () => {
    const response = await api('PATCH', '/api/users/me', { body: { first_name: 'Ada' } });
    expect(response.status).toBe(401);
  });
});

describe('GET /api/users/', () => {
  it('lista as pessoas do workspace quando o workspace_id é informado', async () => {
    const ctx = await contextoOwner();
    const response = await api<{ id: string; username: string }[]>('GET', `/api/users/?workspace_id=${ctx.workspace.id}`, {
      token: ctx.user.token,
    });

    expect(response.status).toBe(200);
    expect(response.body.some((person) => person.id === ctx.user.user.id)).toBe(true);
  });

  it('filtra pessoas do workspace pelo termo de busca', async () => {
    const ctx = await contextoOwner();
    const response = await api<{ username: string }[]>(
      'GET',
      `/api/users/?workspace_id=${ctx.workspace.id}&search=${encodeURIComponent(ctx.user.username)}`,
      { token: ctx.user.token },
    );
    expect(response.status).toBe(200);
    expect(response.body.some((person) => person.username === ctx.user.username)).toBe(true);
  });

  it('devolve lista vazia quando o workspace_id é omitido', async () => {
    const user = await registrarUsuario();
    const response = await api<unknown[]>('GET', '/api/users/', { token: user.token });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('bloqueia a listagem sem token', async () => {
    const response = await api('GET', '/api/users/');
    expect(response.status).toBe(401);
  });
});
