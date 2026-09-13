import { describe, expect, it } from 'vitest';
import './setup';
import { api } from '../helpers/http';
import { contextoOwner, convidarEAceitar, unique } from '../helpers/factories';

describe('GET /api/workspaces/:id/tags', () => {
  it('lista as tags do workspace', async () => {
    const ctx = await contextoOwner();
    const response = await api<unknown[]>('GET', `/api/workspaces/${ctx.workspace.id}/tags`, {
      token: ctx.user.token,
    });
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe('POST /api/workspaces/:id/tags', () => {
  it('cria uma tag com nome e cor', async () => {
    const ctx = await contextoOwner();
    const name = unique('bug');
    const response = await api<{ name: string; color: string }>('POST', `/api/workspaces/${ctx.workspace.id}/tags`, {
      token: ctx.user.token,
      body: { name, color: '#FF0000' },
    });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe(name);
    expect(response.body.color).toBe('#FF0000');
  });

  it('rejeita uma cor inválida', async () => {
    const ctx = await contextoOwner();
    const response = await api('POST', `/api/workspaces/${ctx.workspace.id}/tags`, {
      token: ctx.user.token,
      body: { name: 'bug', color: 'red' },
    });
    expect(response.status).toBe(422);
  });

  it('impede que um membro comum crie tags', async () => {
    const ctx = await contextoOwner();
    const { guest } = await convidarEAceitar(ctx.user.token, ctx.workspace.id, ctx.board.id);
    const response = await api('POST', `/api/workspaces/${ctx.workspace.id}/tags`, {
      token: guest.token,
      body: { name: 'bug', color: '#00FF00' },
    });
    expect(response.status).toBe(403);
  });
});

describe('DELETE /api/workspaces/:id/tags/:tagId', () => {
  it('remove a tag criada', async () => {
    const ctx = await contextoOwner();
    const created = await api<{ id: string }>('POST', `/api/workspaces/${ctx.workspace.id}/tags`, {
      token: ctx.user.token,
      body: { name: unique('tag'), color: '#ABCDEF' },
    });
    const response = await api('DELETE', `/api/workspaces/${ctx.workspace.id}/tags/${created.body.id}`, {
      token: ctx.user.token,
    });
    expect(response.status).toBe(204);
  });
});

describe('GET /api/workspaces/:id/priorities', () => {
  it('lista as prioridades de sistema do workspace recém-criado', async () => {
    const ctx = await contextoOwner();
    const response = await api<{ code: string | null; is_system: boolean }[]>(
      'GET',
      `/api/workspaces/${ctx.workspace.id}/priorities`,
      { token: ctx.user.token },
    );

    expect(response.status).toBe(200);
    expect(response.body.some((priority) => priority.code === 'medium' && priority.is_system)).toBe(true);
  });
});

describe('POST /api/workspaces/:id/priorities', () => {
  it('cria uma prioridade personalizada', async () => {
    const ctx = await contextoOwner();
    const name = unique('urgent');
    const response = await api<{ name: string; is_system: boolean }>(
      'POST',
      `/api/workspaces/${ctx.workspace.id}/priorities`,
      {
        token: ctx.user.token,
        body: { name, color: '#111111', icon: 'zap', position: 10 },
      },
    );

    expect(response.status).toBe(201);
    expect(response.body.name).toBe(name);
    expect(response.body.is_system).toBeFalsy();
  });

  it('rejeita o corpo sem ícone', async () => {
    const ctx = await contextoOwner();
    const response = await api('POST', `/api/workspaces/${ctx.workspace.id}/priorities`, {
      token: ctx.user.token,
      body: { name: 'x', color: '#111111' },
    });
    expect(response.status).toBe(422);
  });
});

describe('DELETE /api/workspaces/:id/priorities/:priorityId', () => {
  it('remove uma prioridade personalizada', async () => {
    const ctx = await contextoOwner();
    const created = await api<{ id: string }>('POST', `/api/workspaces/${ctx.workspace.id}/priorities`, {
      token: ctx.user.token,
      body: { name: unique('custom'), color: '#222222', icon: 'star', position: 8 },
    });
    const response = await api(
      'DELETE',
      `/api/workspaces/${ctx.workspace.id}/priorities/${created.body.id}`,
      { token: ctx.user.token },
    );
    expect(response.status).toBe(204);
  });

  it('impede apagar uma prioridade de sistema', async () => {
    const ctx = await contextoOwner();
    const list = await api<{ id: string; is_system: boolean }[]>(
      'GET',
      `/api/workspaces/${ctx.workspace.id}/priorities`,
      { token: ctx.user.token },
    );
    const system = list.body.find((priority) => priority.is_system);
    expect(system).toBeTruthy();
    const response = await api(
      'DELETE',
      `/api/workspaces/${ctx.workspace.id}/priorities/${system!.id}`,
      { token: ctx.user.token },
    );
    expect(response.status).toBe(409);
  });
});
