import { describe, expect, it } from 'vitest';
import './setup';
import { api } from '../helpers/http';
import {
  contextoOwner,
  criarBoard,
  criarWorkspace,
  registrarUsuario,
  unique,
  UNKNOWN_UUID,
} from '../helpers/factories';

describe('GET /api/workspaces/', () => {
  it('lista os workspaces do usuário autenticado', async () => {
    const ctx = await contextoOwner();
    const response = await api<{ id: string }[]>('GET', '/api/workspaces/', { token: ctx.user.token });

    expect(response.status).toBe(200);
    expect(response.body.some((workspace) => workspace.id === ctx.workspace.id)).toBe(true);
  });

  it('bloqueia a listagem sem token', async () => {
    const response = await api('GET', '/api/workspaces/');
    expect(response.status).toBe(401);
  });
});

describe('POST /api/workspaces/', () => {
  it('cria o workspace e torna o usuário dono', async () => {
    const user = await registrarUsuario();
    const name = unique('Acme');
    const response = await api<{ id: string; name: string; created_by: string }>('POST', '/api/workspaces/', {
      token: user.token,
      body: { name },
    });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe(name);
    expect(response.body.created_by).toBe(user.user.id);
  });

  it('rejeita um nome vazio', async () => {
    const user = await registrarUsuario();
    const response = await api('POST', '/api/workspaces/', { token: user.token, body: { name: '' } });
    expect(response.status).toBe(422);
  });
});

describe('PATCH /api/workspaces/:id', () => {
  it('renomeia o workspace quando o dono solicita', async () => {
    const ctx = await contextoOwner();
    const response = await api<{ name: string }>('PATCH', `/api/workspaces/${ctx.workspace.id}`, {
      token: ctx.user.token,
      body: { name: 'Novo nome' },
    });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Novo nome');
  });

  it('impede que um estranho renomeie o workspace', async () => {
    const ctx = await contextoOwner();
    const stranger = await registrarUsuario();
    const response = await api('PATCH', `/api/workspaces/${ctx.workspace.id}`, {
      token: stranger.token,
      body: { name: 'Hack' },
    });

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({ code: 'FORBIDDEN' });
  });
});

describe('DELETE /api/workspaces/:id', () => {
  it('remove o workspace quando o dono solicita', async () => {
    const ctx = await contextoOwner();
    const response = await api('DELETE', `/api/workspaces/${ctx.workspace.id}`, { token: ctx.user.token });
    expect(response.status).toBe(204);

    const list = await api<{ id: string }[]>('GET', '/api/workspaces/', { token: ctx.user.token });
    expect(list.body.some((workspace) => workspace.id === ctx.workspace.id)).toBe(false);
  });
});

describe('GET /api/workspaces/:id/boards', () => {
  it('lista os boards do workspace aos quais o usuário pertence', async () => {
    const ctx = await contextoOwner();
    const response = await api<{ id: string }[]>('GET', `/api/workspaces/${ctx.workspace.id}/boards`, {
      token: ctx.user.token,
    });

    expect(response.status).toBe(200);
    expect(response.body.some((board) => board.id === ctx.board.id)).toBe(true);
  });

  it('nega o acesso a quem não é membro do workspace', async () => {
    const ctx = await contextoOwner();
    const stranger = await registrarUsuario();
    const response = await api('GET', `/api/workspaces/${ctx.workspace.id}/boards`, { token: stranger.token });
    expect(response.status).toBe(403);
  });
});

describe('POST /api/workspaces/:id/boards', () => {
  it('cria um board adicional no workspace', async () => {
    const ctx = await contextoOwner();
    const name = unique('Roadmap');
    const response = await api<{ id: string; name: string }>('POST', `/api/workspaces/${ctx.workspace.id}/boards`, {
      token: ctx.user.token,
      body: { name },
    });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe(name);
  });

  it('rejeita o corpo sem nome', async () => {
    const ctx = await contextoOwner();
    const response = await api('POST', `/api/workspaces/${ctx.workspace.id}/boards`, {
      token: ctx.user.token,
      body: {},
    });
    expect(response.status).toBe(422);
  });
});

describe('PATCH /api/workspaces/:id/boards/:boardId', () => {
  it('renomeia o board quando o dono solicita', async () => {
    const ctx = await contextoOwner();
    const board = await criarBoard(ctx.user.token, ctx.workspace.id, 'Antigo');
    const response = await api<{ name: string }>(
      'PATCH',
      `/api/workspaces/${ctx.workspace.id}/boards/${board.id}`,
      { token: ctx.user.token, body: { name: 'Atual' } },
    );

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Atual');
  });

  it('informa que o board não existe neste workspace', async () => {
    const ctx = await contextoOwner();
    const other = await criarWorkspace(ctx.user.token);
    const response = await api('PATCH', `/api/workspaces/${other.id}/boards/${ctx.board.id}`, {
      token: ctx.user.token,
      body: { name: 'X' },
    });
    expect(response.status).toBe(404);
  });
});

describe('POST /api/workspaces/:id/boards/:boardId/self-grant', () => {
  it('concede ao dono a associação no board', async () => {
    const ctx = await contextoOwner();
    const response = await api<{ id: string; role: string }>(
      'POST',
      `/api/workspaces/${ctx.workspace.id}/boards/${ctx.board.id}/self-grant`,
      { token: ctx.user.token },
    );

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(ctx.board.id);
    expect(response.body.role).toBe('ADMIN');
  });

  it('não encontra um board inexistente', async () => {
    const ctx = await contextoOwner();
    const response = await api(
      'POST',
      `/api/workspaces/${ctx.workspace.id}/boards/${UNKNOWN_UUID}/self-grant`,
      { token: ctx.user.token },
    );
    expect(response.status).toBe(404);
  });
});
