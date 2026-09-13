import { describe, expect, it } from 'vitest';
import './setup';
import { api } from '../helpers/http';
import { contextoOwner, convidarEAceitar, criarIssue, UNKNOWN_UUID } from '../helpers/factories';

describe('POST /api/comments/', () => {
  it('cria um comentário na issue', async () => {
    const ctx = await contextoOwner();
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    const response = await api<{ content: string; issue_id: string }>('POST', '/api/comments/', {
      token: ctx.user.token,
      body: { issue_id: issue.id, content: 'Primeiro comentário' },
    });

    expect(response.status).toBe(201);
    expect(response.body.content).toBe('Primeiro comentário');
    expect(response.body.issue_id).toBe(issue.id);
  });

  it('rejeita um conteúdo vazio', async () => {
    const ctx = await contextoOwner();
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    const response = await api('POST', '/api/comments/', {
      token: ctx.user.token,
      body: { issue_id: issue.id, content: '' },
    });
    expect(response.status).toBe(422);
  });
});

describe('GET /api/comments/', () => {
  it('lista os comentários da issue', async () => {
    const ctx = await contextoOwner();
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    await api('POST', '/api/comments/', {
      token: ctx.user.token,
      body: { issue_id: issue.id, content: 'Olá' },
    });
    const response = await api<{ data: { content: string }[] }>('GET', `/api/comments/?issue_id=${issue.id}`, {
      token: ctx.user.token,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.some((comment) => comment.content === 'Olá')).toBe(true);
  });

  it('exige o issue_id na consulta', async () => {
    const ctx = await contextoOwner();
    const response = await api('GET', '/api/comments/', { token: ctx.user.token });
    expect(response.status).toBe(422);
  });
});

describe('GET /api/comments/:id/replies', () => {
  it('lista as respostas de um comentário', async () => {
    const ctx = await contextoOwner();
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    const parent = await api<{ id: string }>('POST', '/api/comments/', {
      token: ctx.user.token,
      body: { issue_id: issue.id, content: 'Pai' },
    });
    await api('POST', '/api/comments/', {
      token: ctx.user.token,
      body: { issue_id: issue.id, content: 'Filho', parent_id: parent.body.id },
    });
    const response = await api<{ content: string }[]>(
      'GET',
      `/api/comments/${parent.body.id}/replies`,
      { token: ctx.user.token },
    );

    expect(response.status).toBe(200);
    expect(response.body.some((reply) => reply.content === 'Filho')).toBe(true);
  });

  it('notifica o autor quando outra pessoa responde o comentário', async () => {
    const ctx = await contextoOwner();
    const { guest } = await convidarEAceitar(ctx.user.token, ctx.workspace.id, ctx.board.id);
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    const parent = await api<{ id: string }>('POST', '/api/comments/', {
      token: ctx.user.token,
      body: { issue_id: issue.id, content: 'Pergunta' },
    });
    await api('POST', '/api/comments/', {
      token: guest.token,
      body: { issue_id: issue.id, content: 'Resposta', parent_id: parent.body.id },
    });
    const inbox = await api<{ items: { type: string }[] }>('GET', '/api/notifications/', { token: ctx.user.token });
    expect(inbox.body.items.some((item) => item.type === 'REPLY')).toBe(true);
  });

  it('não encontra um comentário inexistente', async () => {
    const ctx = await contextoOwner();
    const response = await api('GET', `/api/comments/${UNKNOWN_UUID}/replies`, { token: ctx.user.token });
    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/comments/:id', () => {
  it('permite que o autor edite o próprio comentário', async () => {
    const ctx = await contextoOwner();
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    const created = await api<{ id: string }>('POST', '/api/comments/', {
      token: ctx.user.token,
      body: { issue_id: issue.id, content: 'Rascunho' },
    });
    const response = await api<{ content: string }>('PATCH', `/api/comments/${created.body.id}`, {
      token: ctx.user.token,
      body: { content: 'Versão final' },
    });

    expect(response.status).toBe(200);
    expect(response.body.content).toBe('Versão final');
  });

  it('impede editar o comentário de outra pessoa', async () => {
    const ctx = await contextoOwner();
    const { guest } = await convidarEAceitar(ctx.user.token, ctx.workspace.id, ctx.board.id);
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    const created = await api<{ id: string }>('POST', '/api/comments/', {
      token: ctx.user.token,
      body: { issue_id: issue.id, content: 'Do dono' },
    });
    const response = await api('PATCH', `/api/comments/${created.body.id}`, {
      token: guest.token,
      body: { content: 'Invasão' },
    });
    expect(response.status).toBe(403);
  });
});

describe('DELETE /api/comments/:id', () => {
  it('permite que o autor apague o próprio comentário', async () => {
    const ctx = await contextoOwner();
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    const created = await api<{ id: string }>('POST', '/api/comments/', {
      token: ctx.user.token,
      body: { issue_id: issue.id, content: 'Apagar' },
    });
    const response = await api('DELETE', `/api/comments/${created.body.id}`, { token: ctx.user.token });
    expect(response.status).toBe(204);
  });
});
