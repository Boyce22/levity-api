import { describe, expect, it } from 'vitest';
import './setup';
import { api } from '../helpers/http';
import {
  contextoOwner,
  criarIssue,
  registrarUsuario,
  unique,
  UNKNOWN_UUID,
} from '../helpers/factories';

describe('GET /api/boards/:boardId', () => {
  it('devolve o board com colunas padrão e issues', async () => {
    const ctx = await contextoOwner();
    const response = await api<{ board: { id: string }; columns: { title: string }[] }>(
      'GET',
      `/api/boards/${ctx.board.id}`,
      { token: ctx.user.token },
    );

    expect(response.status).toBe(200);
    expect(response.body.board.id).toBe(ctx.board.id);
    expect(response.body.columns.map((column) => column.title)).toEqual(
      expect.arrayContaining(['To Do', 'In Progress', 'Review', 'Done']),
    );
  });

  it('nega o acesso a quem não é membro do board', async () => {
    const ctx = await contextoOwner();
    const stranger = await registrarUsuario();
    const response = await api('GET', `/api/boards/${ctx.board.id}`, { token: stranger.token });
    expect(response.status).toBe(403);
  });

  it('bloqueia a leitura sem token', async () => {
    const ctx = await contextoOwner();
    const response = await api('GET', `/api/boards/${ctx.board.id}`);
    expect(response.status).toBe(401);
  });
});

describe('POST /api/boards/:boardId/columns', () => {
  it('cria uma coluna no board', async () => {
    const ctx = await contextoOwner();
    const title = unique('Blocked');
    const response = await api<{ title: string; board_id: string }>(
      'POST',
      `/api/boards/${ctx.board.id}/columns`,
      { token: ctx.user.token, body: { title, position: 4 } },
    );

    expect(response.status).toBe(201);
    expect(response.body.title).toBe(title);
    expect(response.body.board_id).toBe(ctx.board.id);
  });

  it('rejeita um título vazio', async () => {
    const ctx = await contextoOwner();
    const response = await api('POST', `/api/boards/${ctx.board.id}/columns`, {
      token: ctx.user.token,
      body: { title: '' },
    });
    expect(response.status).toBe(422);
  });
});

describe('PATCH /api/boards/:boardId/columns/:columnId', () => {
  it('atualiza o título da coluna', async () => {
    const ctx = await contextoOwner();
    const response = await api<{ title: string }>(
      'PATCH',
      `/api/boards/${ctx.board.id}/columns/${ctx.todo.id}`,
      { token: ctx.user.token, body: { title: 'Backlog' } },
    );

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Backlog');
  });
});

describe('PATCH /api/boards/:boardId/columns/positions', () => {
  it('reordena as colunas em lote', async () => {
    const ctx = await contextoOwner();
    const payload = ctx.columns.map((column, index) => ({
      id: column.id,
      position: ctx.columns.length - 1 - index,
    }));
    const response = await api('PATCH', `/api/boards/${ctx.board.id}/columns/positions`, {
      token: ctx.user.token,
      body: payload,
    });
    expect(response.status).toBe(204);
  });
});

describe('DELETE /api/boards/:boardId/columns/:columnId', () => {
  it('remove a coluna vazia', async () => {
    const ctx = await contextoOwner();
    const created = await api<{ id: string }>('POST', `/api/boards/${ctx.board.id}/columns`, {
      token: ctx.user.token,
      body: { title: unique('temp'), position: 9 },
    });
    const response = await api('DELETE', `/api/boards/${ctx.board.id}/columns/${created.body.id}`, {
      token: ctx.user.token,
    });
    expect(response.status).toBe(204);
  });
});

describe('POST /api/boards/:boardId/issues', () => {
  it('cria a issue na coluna informada', async () => {
    const ctx = await contextoOwner();
    const content = unique('Implementar login');
    const response = await api<{ content: string; column_id: string; priority_id: string }>(
      'POST',
      `/api/boards/${ctx.board.id}/issues`,
      {
        token: ctx.user.token,
        body: { content, column_id: ctx.todo.id, position: 0 },
      },
    );

    expect(response.status).toBe(201);
    expect(response.body.content).toBe(content);
    expect(response.body.column_id).toBe(ctx.todo.id);
    expect(response.body.priority_id).toBeTruthy();
  });

  it('cria a issue com tag do workspace', async () => {
    const ctx = await contextoOwner();
    const tag = await api<{ id: string }>('POST', `/api/workspaces/${ctx.workspace.id}/tags`, {
      token: ctx.user.token,
      body: { name: unique('feat'), color: '#00AA00' },
    });
    const response = await api<{ tag_id?: string }>('POST', `/api/boards/${ctx.board.id}/issues`, {
      token: ctx.user.token,
      body: { content: unique('tagged'), column_id: ctx.todo.id, position: 0, tag_id: tag.body.id },
    });
    expect(response.status).toBe(201);
    expect(response.body.tag_id).toBe(tag.body.id);
  });

  it('rejeita uma tag que não pertence ao workspace', async () => {
    const ctx = await contextoOwner();
    const response = await api('POST', `/api/boards/${ctx.board.id}/issues`, {
      token: ctx.user.token,
      body: { content: unique('bad-tag'), column_id: ctx.todo.id, position: 0, tag_id: UNKNOWN_UUID },
    });
    expect(response.status).toBe(400);
  });

  it('rejeita uma prioridade que não pertence ao workspace', async () => {
    const ctx = await contextoOwner();
    const response = await api('POST', `/api/boards/${ctx.board.id}/issues`, {
      token: ctx.user.token,
      body: { content: unique('bad-prio'), column_id: ctx.todo.id, position: 0, priority_id: UNKNOWN_UUID },
    });
    expect(response.status).toBe(400);
  });

  it('respeita o limite WIP da coluna', async () => {
    const ctx = await contextoOwner();
    await api('PATCH', `/api/boards/${ctx.board.id}/columns/${ctx.todo.id}`, {
      token: ctx.user.token,
      body: { wip_limit: 1 },
    });
    await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    const response = await api('POST', `/api/boards/${ctx.board.id}/issues`, {
      token: ctx.user.token,
      body: { content: unique('overflow'), column_id: ctx.todo.id, position: 1 },
    });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ code: 'BAD_REQUEST' });
  });
});

describe('PATCH /api/boards/:boardId/issues/:issueId', () => {
  it('atualiza o conteúdo da issue', async () => {
    const ctx = await contextoOwner();
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    const response = await api<{ content: string }>(
      'PATCH',
      `/api/boards/${ctx.board.id}/issues/${issue.id}`,
      { token: ctx.user.token, body: { content: 'Título novo' } },
    );

    expect(response.status).toBe(200);
    expect(response.body.content).toBe('Título novo');
  });

  it('move a issue para outra coluna e registra o histórico', async () => {
    const ctx = await contextoOwner();
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    const target = ctx.columns.find((column) => column.id !== ctx.todo.id) ?? ctx.columns[1];
    const response = await api<{ column_id: string }>(
      'PATCH',
      `/api/boards/${ctx.board.id}/issues/${issue.id}`,
      { token: ctx.user.token, body: { column_id: target.id, position: 0 } },
    );
    expect(response.status).toBe(200);
    expect(response.body.column_id).toBe(target.id);
  });
});

describe('PATCH /api/boards/:boardId/issues/positions', () => {
  it('move as issues entre colunas', async () => {
    const ctx = await contextoOwner();
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    const target = ctx.columns.find((column) => column.id !== ctx.todo.id) ?? ctx.columns[1];
    const response = await api('PATCH', `/api/boards/${ctx.board.id}/issues/positions`, {
      token: ctx.user.token,
      body: [{ id: issue.id, position: 0, column_id: target.id }],
    });
    expect(response.status).toBe(204);
  });
});

describe('DELETE /api/boards/:boardId/issues/:issueId', () => {
  it('remove a issue do board', async () => {
    const ctx = await contextoOwner();
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    const response = await api('DELETE', `/api/boards/${ctx.board.id}/issues/${issue.id}`, {
      token: ctx.user.token,
    });
    expect(response.status).toBe(204);
  });
});

describe('GET /api/boards/:boardId/issues/:issueId/history', () => {
  it('lista os eventos de criação e alteração da issue', async () => {
    const ctx = await contextoOwner();
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    await api('PATCH', `/api/boards/${ctx.board.id}/issues/${issue.id}`, {
      token: ctx.user.token,
      body: { content: 'Mudou' },
    });
    const response = await api<{ action_type: string }[]>(
      'GET',
      `/api/boards/${ctx.board.id}/issues/${issue.id}/history`,
      { token: ctx.user.token },
    );

    expect(response.status).toBe(200);
    expect(response.body.some((event) => event.action_type === 'created')).toBe(true);
  });

  it('não encontra uma issue inexistente', async () => {
    const ctx = await contextoOwner();
    const response = await api(
      'GET',
      `/api/boards/${ctx.board.id}/issues/${UNKNOWN_UUID}/history`,
      { token: ctx.user.token },
    );
    expect(response.status).toBe(404);
  });
});
