import { describe, expect, it } from 'vitest';
import './setup';
import { api } from '../helpers/http';
import { contextoOwner, criarIssue, registrarUsuario, UNKNOWN_UUID } from '../helpers/factories';

describe('PUT /api/diagrams/', () => {
  it('grava o diagrama da issue', async () => {
    const ctx = await contextoOwner();
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    const response = await api<{ issue_id: string; data: { elements: { id: string }[] } }>(
      'PUT',
      '/api/diagrams/',
      {
        token: ctx.user.token,
        body: {
          issue_id: issue.id,
          data: {
            elements: [{ type: 'rect', id: 'el-1', x: 10, y: 20, width: 40, height: 30, color: '#000000' }],
          },
        },
      },
    );

    expect(response.status).toBe(200);
    expect(response.body.issue_id).toBe(issue.id);
    expect(response.body.data.elements[0]?.id).toBe('el-1');
  });

  it('rejeita um tipo de elemento inválido', async () => {
    const ctx = await contextoOwner();
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    const response = await api('PUT', '/api/diagrams/', {
      token: ctx.user.token,
      body: { issue_id: issue.id, data: { elements: [{ type: 'triangle', id: 'x' }] } },
    });
    expect(response.status).toBe(422);
  });
});

describe('GET /api/diagrams/:issueId', () => {
  it('devolve o diagrama salvo da issue', async () => {
    const ctx = await contextoOwner();
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    await api('PUT', '/api/diagrams/', {
      token: ctx.user.token,
      body: { issue_id: issue.id, data: { elements: [{ type: 'circle', id: 'c1' }] } },
    });
    const response = await api<{ issue_id: string }>('GET', `/api/diagrams/${issue.id}`, { token: ctx.user.token });

    expect(response.status).toBe(200);
    expect(response.body?.issue_id).toBe(issue.id);
  });

  it('devolve nulo quando a issue ainda não tem diagrama', async () => {
    const ctx = await contextoOwner();
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    const response = await api('GET', `/api/diagrams/${issue.id}`, { token: ctx.user.token });
    expect(response.status).toBe(200);
    expect(response.body).toBeNull();
  });

  it('nega o acesso a quem não é membro do board', async () => {
    const ctx = await contextoOwner();
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    const stranger = await registrarUsuario();
    const response = await api('GET', `/api/diagrams/${issue.id}`, { token: stranger.token });
    expect(response.status).toBe(403);
  });
});

describe('DELETE /api/diagrams/:issueId', () => {
  it('remove o diagrama da issue', async () => {
    const ctx = await contextoOwner();
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    await api('PUT', '/api/diagrams/', {
      token: ctx.user.token,
      body: { issue_id: issue.id, data: { elements: [{ type: 'line', id: 'l1' }] } },
    });
    const response = await api('DELETE', `/api/diagrams/${issue.id}`, { token: ctx.user.token });
    expect(response.status).toBe(204);

    const after = await api('GET', `/api/diagrams/${issue.id}`, { token: ctx.user.token });
    expect(after.body).toBeNull();
  });

  it('não encontra uma issue inexistente', async () => {
    const ctx = await contextoOwner();
    const response = await api('DELETE', `/api/diagrams/${UNKNOWN_UUID}`, { token: ctx.user.token });
    expect(response.status).toBe(404);
  });
});
