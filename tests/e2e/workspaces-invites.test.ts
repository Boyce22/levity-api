import { describe, expect, it } from 'vitest';
import './setup';
import { BoardRole, WorkspaceRole } from '../../src/contracts';
import { api } from '../helpers/http';
import {
  aceitarConvite,
  contextoOwner,
  gerarConvite,
  registrarUsuario,
  UNKNOWN_UUID,
} from '../helpers/factories';

describe('POST /api/workspaces/:id/invites', () => {
  it('gera um convite com grants de board', async () => {
    const ctx = await contextoOwner();
    const response = await api<{ token: string; grants: { board_id: string }[] }>(
      'POST',
      `/api/workspaces/${ctx.workspace.id}/invites`,
      {
        token: ctx.user.token,
        body: {
          max_uses: 2,
          workspace_role: WorkspaceRole.MEMBER,
          board_grants: [{ board_id: ctx.board.id, board_role: BoardRole.EDITOR }],
        },
      },
    );

    expect(response.status).toBe(201);
    expect(response.body.token).toBeTruthy();
    expect(response.body.grants[0]?.board_id).toBe(ctx.board.id);
  });

  it('rejeita grants repetidos para o mesmo board', async () => {
    const ctx = await contextoOwner();
    const response = await api('POST', `/api/workspaces/${ctx.workspace.id}/invites`, {
      token: ctx.user.token,
      body: {
        board_grants: [
          { board_id: ctx.board.id, board_role: BoardRole.EDITOR },
          { board_id: ctx.board.id, board_role: BoardRole.VIEWER },
        ],
      },
    });
    expect(response.status).toBe(400);
  });

  it('rejeita grants de um board que não pertence ao workspace', async () => {
    const ctx = await contextoOwner();
    const response = await api('POST', `/api/workspaces/${ctx.workspace.id}/invites`, {
      token: ctx.user.token,
      body: {
        board_grants: [{ board_id: UNKNOWN_UUID, board_role: BoardRole.EDITOR }],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('rejeita o corpo sem board_grants', async () => {
    const ctx = await contextoOwner();
    const response = await api('POST', `/api/workspaces/${ctx.workspace.id}/invites`, {
      token: ctx.user.token,
      body: { max_uses: 1 },
    });
    expect(response.status).toBe(422);
  });
});

describe('GET /api/workspaces/:id/invites', () => {
  it('lista os convites do workspace para o dono', async () => {
    const ctx = await contextoOwner();
    const invite = await gerarConvite(ctx.user.token, ctx.workspace.id, ctx.board.id);
    const response = await api<{ id: string }[]>('GET', `/api/workspaces/${ctx.workspace.id}/invites`, {
      token: ctx.user.token,
    });

    expect(response.status).toBe(200);
    expect(response.body.some((item) => item.id === invite.id)).toBe(true);
  });

  it('impede que um não-membro liste os convites', async () => {
    const ctx = await contextoOwner();
    const stranger = await registrarUsuario();
    const response = await api('GET', `/api/workspaces/${ctx.workspace.id}/invites`, { token: stranger.token });
    expect(response.status).toBe(403);
  });
});

describe('GET /api/workspaces/:id/invites/:token', () => {
  it('mostra os detalhes do convite pelo token', async () => {
    const ctx = await contextoOwner();
    const invite = await gerarConvite(ctx.user.token, ctx.workspace.id, ctx.board.id);
    const guest = await registrarUsuario();
    const response = await api<{ id: string; token: string }>(
      'GET',
      `/api/workspaces/${ctx.workspace.id}/invites/${invite.token}`,
      { token: guest.token },
    );

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(invite.id);
  });

  it('informa que o convite não existe', async () => {
    const ctx = await contextoOwner();
    const response = await api('GET', `/api/workspaces/${ctx.workspace.id}/invites/${UNKNOWN_UUID}`, {
      token: ctx.user.token,
    });
    expect(response.status).toBe(404);
  });
});

describe('POST /api/workspaces/:id/invites/:token/accept', () => {
  it('adiciona o convidado ao workspace e ao board', async () => {
    const ctx = await contextoOwner();
    const invite = await gerarConvite(ctx.user.token, ctx.workspace.id, ctx.board.id);
    const guest = await registrarUsuario();
    const response = await api<{ user_id: string; workspace_id: string }>(
      'POST',
      `/api/workspaces/${ctx.workspace.id}/invites/${invite.token}/accept`,
      { token: guest.token },
    );

    expect(response.status).toBe(200);
    expect(response.body.user_id).toBe(guest.user.id);
    expect(response.body.workspace_id).toBe(ctx.workspace.id);

    const boards = await api<{ id: string }[]>('GET', `/api/workspaces/${ctx.workspace.id}/boards`, {
      token: guest.token,
    });
    expect(boards.body.some((board) => board.id === ctx.board.id)).toBe(true);
  });

  it('não permite reutilizar um convite já consumido', async () => {
    const ctx = await contextoOwner();
    const invite = await gerarConvite(ctx.user.token, ctx.workspace.id, ctx.board.id, { max_uses: 1 });
    const first = await registrarUsuario();
    await aceitarConvite(first.token, ctx.workspace.id, invite.token);

    const second = await registrarUsuario();
    const response = await api(
      'POST',
      `/api/workspaces/${ctx.workspace.id}/invites/${invite.token}/accept`,
      { token: second.token },
    );
    expect(response.status).toBe(400);
  });
});

describe('DELETE /api/workspaces/:id/invites/:inviteId', () => {
  it('revoga o convite ainda ativo', async () => {
    const ctx = await contextoOwner();
    const invite = await gerarConvite(ctx.user.token, ctx.workspace.id, ctx.board.id);
    const response = await api('DELETE', `/api/workspaces/${ctx.workspace.id}/invites/${invite.id}`, {
      token: ctx.user.token,
    });
    expect(response.status).toBe(204);
  });

  it('recusa revogar um convite já revogado', async () => {
    const ctx = await contextoOwner();
    const invite = await gerarConvite(ctx.user.token, ctx.workspace.id, ctx.board.id);
    await api('DELETE', `/api/workspaces/${ctx.workspace.id}/invites/${invite.id}`, { token: ctx.user.token });
    const response = await api('DELETE', `/api/workspaces/${ctx.workspace.id}/invites/${invite.id}`, {
      token: ctx.user.token,
    });
    expect(response.status).toBe(409);
  });
});
