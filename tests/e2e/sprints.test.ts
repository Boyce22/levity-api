import { describe, expect, it } from 'vitest';
import './setup';
import { SprintTrackingMode } from '../../src/contracts';
import { api } from '../helpers/http';
import { contextoOwner, criarIssue, unique, UNKNOWN_UUID } from '../helpers/factories';

function sprintPayload(name = unique('Sprint')) {
  return {
    name,
    goal: 'Entregar o MVP',
    start_date: '2026-09-01',
    end_date: '2026-09-14',
    tracking_mode: SprintTrackingMode.POINTS,
    capacity_points: 20,
  };
}

describe('POST /api/boards/:boardId/sprints', () => {
  it('cria uma sprint em planejamento', async () => {
    const ctx = await contextoOwner();
    const name = unique('Sprint 1');
    const response = await api<{ name: string; status: string }>('POST', `/api/boards/${ctx.board.id}/sprints`, {
      token: ctx.user.token,
      body: sprintPayload(name),
    });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe(name);
    expect(response.body.status).toBe('PLANNING');
  });

  it('rejeita datas em formato inválido', async () => {
    const ctx = await contextoOwner();
    const response = await api('POST', `/api/boards/${ctx.board.id}/sprints`, {
      token: ctx.user.token,
      body: { ...sprintPayload(), start_date: 'ontem' },
    });
    expect(response.status).toBe(422);
  });
});

describe('GET /api/boards/:boardId/sprints', () => {
  it('lista as sprints do board', async () => {
    const ctx = await contextoOwner();
    const created = await api<{ id: string }>('POST', `/api/boards/${ctx.board.id}/sprints`, {
      token: ctx.user.token,
      body: sprintPayload(),
    });
    const response = await api<{ id: string }[]>('GET', `/api/boards/${ctx.board.id}/sprints`, {
      token: ctx.user.token,
    });

    expect(response.status).toBe(200);
    expect(response.body.some((sprint) => sprint.id === created.body.id)).toBe(true);
  });
});

describe('GET /api/boards/:boardId/sprints/active', () => {
  it('devolve nulo quando nenhuma sprint está ativa', async () => {
    const ctx = await contextoOwner();
    const response = await api('GET', `/api/boards/${ctx.board.id}/sprints/active`, { token: ctx.user.token });
    expect(response.status).toBe(200);
    expect(response.body).toBeNull();
  });

  it('devolve a sprint ativa do board', async () => {
    const ctx = await contextoOwner();
    const created = await api<{ id: string }>('POST', `/api/boards/${ctx.board.id}/sprints`, {
      token: ctx.user.token,
      body: sprintPayload(),
    });
    await api('POST', `/api/boards/${ctx.board.id}/sprints/${created.body.id}/activate`, {
      token: ctx.user.token,
    });
    const response = await api<{ id: string; status: string }>(
      'GET',
      `/api/boards/${ctx.board.id}/sprints/active`,
      { token: ctx.user.token },
    );

    expect(response.status).toBe(200);
    expect(response.body?.id).toBe(created.body.id);
    expect(response.body?.status).toBe('ACTIVE');
  });
});

describe('GET /api/boards/:boardId/sprints/:sprintId', () => {
  it('devolve a sprint com as issues associadas', async () => {
    const ctx = await contextoOwner();
    const sprint = await api<{ id: string }>('POST', `/api/boards/${ctx.board.id}/sprints`, {
      token: ctx.user.token,
      body: sprintPayload(),
    });
    const response = await api<{ id: string }>('GET', `/api/boards/${ctx.board.id}/sprints/${sprint.body.id}`, {
      token: ctx.user.token,
    });
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(sprint.body.id);
  });

  it('não encontra sprint de outro board', async () => {
    const ctx = await contextoOwner();
    const response = await api('GET', `/api/boards/${ctx.board.id}/sprints/${UNKNOWN_UUID}`, {
      token: ctx.user.token,
    });
    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/boards/:boardId/sprints/:sprintId', () => {
  it('atualiza o nome da sprint', async () => {
    const ctx = await contextoOwner();
    const sprint = await api<{ id: string }>('POST', `/api/boards/${ctx.board.id}/sprints`, {
      token: ctx.user.token,
      body: sprintPayload(),
    });
    const response = await api<{ name: string }>(
      'PATCH',
      `/api/boards/${ctx.board.id}/sprints/${sprint.body.id}`,
      { token: ctx.user.token, body: { name: 'Sprint revisada' } },
    );
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Sprint revisada');
  });
});

describe('POST /api/boards/:boardId/sprints/:sprintId/activate', () => {
  it('ativa a sprint em planejamento', async () => {
    const ctx = await contextoOwner();
    const sprint = await api<{ id: string }>('POST', `/api/boards/${ctx.board.id}/sprints`, {
      token: ctx.user.token,
      body: sprintPayload(),
    });
    const response = await api<{ status: string }>(
      'POST',
      `/api/boards/${ctx.board.id}/sprints/${sprint.body.id}/activate`,
      { token: ctx.user.token },
    );
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ACTIVE');
  });

  it('impede ativar uma segunda sprint no mesmo board', async () => {
    const ctx = await contextoOwner();
    const first = await api<{ id: string }>('POST', `/api/boards/${ctx.board.id}/sprints`, {
      token: ctx.user.token,
      body: sprintPayload(),
    });
    const second = await api<{ id: string }>('POST', `/api/boards/${ctx.board.id}/sprints`, {
      token: ctx.user.token,
      body: sprintPayload(),
    });
    await api('POST', `/api/boards/${ctx.board.id}/sprints/${first.body.id}/activate`, { token: ctx.user.token });
    const response = await api('POST', `/api/boards/${ctx.board.id}/sprints/${second.body.id}/activate`, {
      token: ctx.user.token,
    });
    expect(response.status).toBe(409);
  });
});

describe('POST /api/boards/:boardId/sprints/:sprintId/issues', () => {
  it('adiciona a issue à sprint', async () => {
    const ctx = await contextoOwner();
    const sprint = await api<{ id: string }>('POST', `/api/boards/${ctx.board.id}/sprints`, {
      token: ctx.user.token,
      body: sprintPayload(),
    });
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    const response = await api<{ issue_id: string }>(
      'POST',
      `/api/boards/${ctx.board.id}/sprints/${sprint.body.id}/issues`,
      { token: ctx.user.token, body: { issue_id: issue.id } },
    );

    expect(response.status).toBe(201);
    expect(response.body.issue_id).toBe(issue.id);
  });

  it('impede colocar a issue em outra sprint enquanto ela está numa sprint ativa', async () => {
    const ctx = await contextoOwner();
    const active = await api<{ id: string }>('POST', `/api/boards/${ctx.board.id}/sprints`, {
      token: ctx.user.token,
      body: sprintPayload(),
    });
    const planning = await api<{ id: string }>('POST', `/api/boards/${ctx.board.id}/sprints`, {
      token: ctx.user.token,
      body: sprintPayload(),
    });
    await api('POST', `/api/boards/${ctx.board.id}/sprints/${active.body.id}/activate`, { token: ctx.user.token });
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    await api('POST', `/api/boards/${ctx.board.id}/sprints/${active.body.id}/issues`, {
      token: ctx.user.token,
      body: { issue_id: issue.id },
    });
    const response = await api('POST', `/api/boards/${ctx.board.id}/sprints/${planning.body.id}/issues`, {
      token: ctx.user.token,
      body: { issue_id: issue.id },
    });
    expect(response.status).toBe(409);
  });
});

describe('PATCH /api/boards/:boardId/sprints/:sprintId/issues/reorder', () => {
  it('reordena as issues da sprint', async () => {
    const ctx = await contextoOwner();
    const sprint = await api<{ id: string }>('POST', `/api/boards/${ctx.board.id}/sprints`, {
      token: ctx.user.token,
      body: sprintPayload(),
    });
    const first = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    const second = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    const addedFirst = await api<{ id: string }>(
      'POST',
      `/api/boards/${ctx.board.id}/sprints/${sprint.body.id}/issues`,
      { token: ctx.user.token, body: { issue_id: first.id } },
    );
    const addedSecond = await api<{ id: string }>(
      'POST',
      `/api/boards/${ctx.board.id}/sprints/${sprint.body.id}/issues`,
      { token: ctx.user.token, body: { issue_id: second.id } },
    );
    const response = await api(
      'PATCH',
      `/api/boards/${ctx.board.id}/sprints/${sprint.body.id}/issues/reorder`,
      {
        token: ctx.user.token,
        body: [
          { id: addedSecond.body.id, position: 0 },
          { id: addedFirst.body.id, position: 1 },
        ],
      },
    );
    expect(response.status).toBe(204);
  });
});

describe('DELETE /api/boards/:boardId/sprints/:sprintId/issues/:issueId', () => {
  it('remove a issue da sprint', async () => {
    const ctx = await contextoOwner();
    const sprint = await api<{ id: string }>('POST', `/api/boards/${ctx.board.id}/sprints`, {
      token: ctx.user.token,
      body: sprintPayload(),
    });
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    await api('POST', `/api/boards/${ctx.board.id}/sprints/${sprint.body.id}/issues`, {
      token: ctx.user.token,
      body: { issue_id: issue.id },
    });
    const response = await api(
      'DELETE',
      `/api/boards/${ctx.board.id}/sprints/${sprint.body.id}/issues/${issue.id}`,
      { token: ctx.user.token },
    );
    expect(response.status).toBe(204);
  });
});

describe('POST /api/boards/:boardId/sprints/:sprintId/complete', () => {
  it('conclui a sprint ativa', async () => {
    const ctx = await contextoOwner();
    const sprint = await api<{ id: string }>('POST', `/api/boards/${ctx.board.id}/sprints`, {
      token: ctx.user.token,
      body: sprintPayload(),
    });
    await api('POST', `/api/boards/${ctx.board.id}/sprints/${sprint.body.id}/activate`, { token: ctx.user.token });
    const response = await api<{ status: string }>(
      'POST',
      `/api/boards/${ctx.board.id}/sprints/${sprint.body.id}/complete`,
      { token: ctx.user.token, body: {} },
    );
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('COMPLETED');
  });

  it('calcula a velocidade por contagem de issues concluídas', async () => {
    const ctx = await contextoOwner();
    const sprint = await api<{ id: string }>('POST', `/api/boards/${ctx.board.id}/sprints`, {
      token: ctx.user.token,
      body: { ...sprintPayload(), tracking_mode: SprintTrackingMode.COUNT },
    });
    await api('POST', `/api/boards/${ctx.board.id}/sprints/${sprint.body.id}/activate`, { token: ctx.user.token });
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    await api('PATCH', `/api/boards/${ctx.board.id}/issues/${issue.id}`, {
      token: ctx.user.token,
      body: { progress: 100 },
    });
    await api('POST', `/api/boards/${ctx.board.id}/sprints/${sprint.body.id}/issues`, {
      token: ctx.user.token,
      body: { issue_id: issue.id },
    });
    const response = await api<{ velocity_points?: number }>(
      'POST',
      `/api/boards/${ctx.board.id}/sprints/${sprint.body.id}/complete`,
      { token: ctx.user.token, body: {} },
    );
    expect(response.status).toBe(200);
    expect(response.body.velocity_points).toBe(1);
  });

  it('move as issues inacabadas para a sprint destino ao concluir', async () => {
    const ctx = await contextoOwner();
    const current = await api<{ id: string }>('POST', `/api/boards/${ctx.board.id}/sprints`, {
      token: ctx.user.token,
      body: sprintPayload(),
    });
    const next = await api<{ id: string }>('POST', `/api/boards/${ctx.board.id}/sprints`, {
      token: ctx.user.token,
      body: sprintPayload(),
    });
    await api('POST', `/api/boards/${ctx.board.id}/sprints/${current.body.id}/activate`, { token: ctx.user.token });
    const issue = await criarIssue(ctx.user.token, ctx.board.id, ctx.todo.id);
    await api('POST', `/api/boards/${ctx.board.id}/sprints/${current.body.id}/issues`, {
      token: ctx.user.token,
      body: { issue_id: issue.id },
    });
    const response = await api<{ status: string }>(
      'POST',
      `/api/boards/${ctx.board.id}/sprints/${current.body.id}/complete`,
      { token: ctx.user.token, body: { to_sprint_id: next.body.id } },
    );
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('COMPLETED');
  });

  it('recusa concluir uma sprint ainda em planejamento', async () => {
    const ctx = await contextoOwner();
    const sprint = await api<{ id: string }>('POST', `/api/boards/${ctx.board.id}/sprints`, {
      token: ctx.user.token,
      body: sprintPayload(),
    });
    const response = await api('POST', `/api/boards/${ctx.board.id}/sprints/${sprint.body.id}/complete`, {
      token: ctx.user.token,
      body: {},
    });
    expect(response.status).toBe(400);
  });
});

describe('DELETE /api/boards/:boardId/sprints/:sprintId', () => {
  it('apaga a sprint em planejamento', async () => {
    const ctx = await contextoOwner();
    const sprint = await api<{ id: string }>('POST', `/api/boards/${ctx.board.id}/sprints`, {
      token: ctx.user.token,
      body: sprintPayload(),
    });
    const response = await api('DELETE', `/api/boards/${ctx.board.id}/sprints/${sprint.body.id}`, {
      token: ctx.user.token,
    });
    expect(response.status).toBe(204);
  });

  it('impede apagar uma sprint ativa', async () => {
    const ctx = await contextoOwner();
    const sprint = await api<{ id: string }>('POST', `/api/boards/${ctx.board.id}/sprints`, {
      token: ctx.user.token,
      body: sprintPayload(),
    });
    await api('POST', `/api/boards/${ctx.board.id}/sprints/${sprint.body.id}/activate`, { token: ctx.user.token });
    const response = await api('DELETE', `/api/boards/${ctx.board.id}/sprints/${sprint.body.id}`, {
      token: ctx.user.token,
    });
    expect(response.status).toBe(400);
  });
});
