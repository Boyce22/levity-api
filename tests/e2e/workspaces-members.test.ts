import { describe, expect, it } from 'vitest';
import './setup';
import { WorkspaceRole } from '../../src/contracts';
import { api } from '../helpers/http';
import { contextoOwner, convidarEAceitar, registrarUsuario } from '../helpers/factories';

describe('GET /api/workspaces/:id/members', () => {
  it('lista os membros do workspace', async () => {
    const ctx = await contextoOwner();
    const { guest } = await convidarEAceitar(ctx.user.token, ctx.workspace.id, ctx.board.id);
    const response = await api<{ user_id: string }[]>('GET', `/api/workspaces/${ctx.workspace.id}/members`, {
      token: ctx.user.token,
    });

    expect(response.status).toBe(200);
    const userIds = response.body.map((member) => member.user_id);
    expect(userIds).toEqual(expect.arrayContaining([ctx.user.user.id, guest.user.id]));
  });

  it('impede que um estranho veja os membros', async () => {
    const ctx = await contextoOwner();
    const stranger = await registrarUsuario();
    const response = await api('GET', `/api/workspaces/${ctx.workspace.id}/members`, { token: stranger.token });
    expect(response.status).toBe(403);
  });
});

describe('PATCH /api/workspaces/:id/members/:memberId/role', () => {
  it('atualiza o papel do membro quando o dono solicita', async () => {
    const ctx = await contextoOwner();
    const { guest } = await convidarEAceitar(ctx.user.token, ctx.workspace.id, ctx.board.id);
    const response = await api<{ role: string }>(
      'PATCH',
      `/api/workspaces/${ctx.workspace.id}/members/${guest.user.id}/role`,
      { token: ctx.user.token, body: { role: WorkspaceRole.ADMIN } },
    );

    expect(response.status).toBe(200);
    expect(response.body.role).toBe(WorkspaceRole.ADMIN);
  });

  it('rejeita um papel inválido', async () => {
    const ctx = await contextoOwner();
    const response = await api(
      'PATCH',
      `/api/workspaces/${ctx.workspace.id}/members/${ctx.user.user.id}/role`,
      { token: ctx.user.token, body: { role: 'SUPER' } },
    );
    expect(response.status).toBe(422);
  });

  it('impede que um membro comum altere papéis', async () => {
    const ctx = await contextoOwner();
    const { guest } = await convidarEAceitar(ctx.user.token, ctx.workspace.id, ctx.board.id);
    const response = await api(
      'PATCH',
      `/api/workspaces/${ctx.workspace.id}/members/${ctx.user.user.id}/role`,
      { token: guest.token, body: { role: WorkspaceRole.MEMBER } },
    );
    expect(response.status).toBe(403);
  });
});

describe('DELETE /api/workspaces/:id/members/:memberId', () => {
  it('remove o membro do workspace', async () => {
    const ctx = await contextoOwner();
    const { guest } = await convidarEAceitar(ctx.user.token, ctx.workspace.id, ctx.board.id);
    const response = await api('DELETE', `/api/workspaces/${ctx.workspace.id}/members/${guest.user.id}`, {
      token: ctx.user.token,
    });
    expect(response.status).toBe(204);

    const boards = await api('GET', `/api/workspaces/${ctx.workspace.id}/boards`, { token: guest.token });
    expect(boards.status).toBe(403);
  });

  it('impede que um membro comum remova outra pessoa', async () => {
    const ctx = await contextoOwner();
    const { guest } = await convidarEAceitar(ctx.user.token, ctx.workspace.id, ctx.board.id);
    const response = await api('DELETE', `/api/workspaces/${ctx.workspace.id}/members/${ctx.user.user.id}`, {
      token: guest.token,
    });
    expect(response.status).toBe(403);
  });
});
