import { describe, expect, it } from 'vitest';
import './setup';
import { NotificationType } from '../../src/contracts';
import { api } from '../helpers/http';
import { contextoOwner, convidarEAceitar, criarIssue, registrarUsuario } from '../helpers/factories';

describe('GET /api/notifications/', () => {
  it('lista as notificações geradas por menção', async () => {
    const ctx = await contextoOwner();
    const { guest } = await convidarEAceitar(ctx.user.token, ctx.workspace.id, ctx.board.id);
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    await api('POST', '/api/comments/', {
      token: ctx.user.token,
      body: { issue_id: issue.id, content: `Olá @${guest.username}` },
    });

    const response = await api<{ items: { type: string; user_id: string }[] }>(
      'GET',
      '/api/notifications/',
      { token: guest.token },
    );

    expect(response.status).toBe(200);
    expect(response.body.items.some((item) => item.type === NotificationType.MENTION)).toBe(true);
  });

  it('lista as notificações geradas por atribuição', async () => {
    const ctx = await contextoOwner();
    const { guest } = await convidarEAceitar(ctx.user.token, ctx.workspace.id, ctx.board.id);
    await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id, 'Com assignee', {
      assignee_id: guest.user.id,
    });

    const response = await api<{ items: { type: string }[] }>('GET', '/api/notifications/', { token: guest.token });
    expect(response.status).toBe(200);
    expect(response.body.items.some((item) => item.type === NotificationType.ASSIGNMENT)).toBe(true);
  });

  it('filtra apenas as não lidas', async () => {
    const ctx = await contextoOwner();
    const { guest } = await convidarEAceitar(ctx.user.token, ctx.workspace.id, ctx.board.id);
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    await api('POST', '/api/comments/', {
      token: ctx.user.token,
      body: { issue_id: issue.id, content: `@${guest.username} ping` },
    });
    const response = await api<{ items: { read: boolean }[] }>('GET', '/api/notifications/?read=false', {
      token: guest.token,
    });
    expect(response.status).toBe(200);
    expect(response.body.items.every((item) => item.read === false)).toBe(true);
  });

  it('pagina a caixa de entrada pelo cursor de data', async () => {
    const ctx = await contextoOwner();
    const { guest } = await convidarEAceitar(ctx.user.token, ctx.workspace.id, ctx.board.id);
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    await api('POST', '/api/comments/', {
      token: ctx.user.token,
      body: { issue_id: issue.id, content: `@${guest.username} primeira` },
    });
    await api('POST', '/api/comments/', {
      token: ctx.user.token,
      body: { issue_id: issue.id, content: `@${guest.username} segunda` },
    });
    const inbox = await api<{ items: { created_at: string }[] }>('GET', '/api/notifications/?limit=1', {
      token: guest.token,
    });
    expect(inbox.body.items).toHaveLength(1);
    const cursor = encodeURIComponent(inbox.body.items[0]!.created_at);
    const paged = await api<{ items: unknown[]; nextCursor?: string }>(
      'GET',
      `/api/notifications/?limit=10&cursor=${cursor}`,
      { token: guest.token },
    );
    expect(paged.status).toBe(200);
    expect(Array.isArray(paged.body.items)).toBe(true);
  });

  it('bloqueia a caixa de entrada sem token', async () => {
    const response = await api('GET', '/api/notifications/');
    expect(response.status).toBe(401);
  });
});

describe('PATCH /api/notifications/:id/read', () => {
  it('marca uma notificação como lida', async () => {
    const ctx = await contextoOwner();
    const { guest } = await convidarEAceitar(ctx.user.token, ctx.workspace.id, ctx.board.id);
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    await api('POST', '/api/comments/', {
      token: ctx.user.token,
      body: { issue_id: issue.id, content: `@${guest.username} leia` },
    });
    const inbox = await api<{ items: { id: string }[] }>('GET', '/api/notifications/', { token: guest.token });
    const notification = inbox.body.items[0];
    expect(notification).toBeTruthy();

    const response = await api('PATCH', `/api/notifications/${notification!.id}/read`, { token: guest.token });
    expect(response.status).toBe(204);

    const unread = await api<{ items: { id: string }[] }>('GET', '/api/notifications/?read=false', {
      token: guest.token,
    });
    expect(unread.body.items.some((item) => item.id === notification!.id)).toBe(false);
  });
});

describe('POST /api/notifications/read-all', () => {
  it('marca todas as notificações do usuário como lidas', async () => {
    const ctx = await contextoOwner();
    const { guest } = await convidarEAceitar(ctx.user.token, ctx.workspace.id, ctx.board.id);
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    await api('POST', '/api/comments/', {
      token: ctx.user.token,
      body: { issue_id: issue.id, content: `@${guest.username} um` },
    });
    const response = await api('POST', '/api/notifications/read-all', { token: guest.token });
    expect(response.status).toBe(204);

    const unread = await api<{ items: unknown[] }>('GET', '/api/notifications/?read=false', { token: guest.token });
    expect(unread.body.items).toEqual([]);
  });

  it('não permite que outro usuário marque a caixa alheia', async () => {
    const stranger = await registrarUsuario();
    const response = await api('POST', '/api/notifications/read-all', { token: stranger.token });
    expect(response.status).toBe(204);
  });
});
