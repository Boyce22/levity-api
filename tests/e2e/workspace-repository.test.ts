import { describe, expect, it } from 'vitest';
import './setup';
import { AppDataSource, Workspace, WorkspaceRepository } from '../../src/db';
import { NotFoundError } from '../../src/shared';
import { api } from '../helpers/http';
import { contextoOwner, unique, UNKNOWN_UUID } from '../helpers/factories';

describe('WorkspaceRepository.findFullData', () => {
  it('monta o workspace com membros, tags e prioridades', async () => {
    const ctx = await contextoOwner();
    await api('POST', `/api/workspaces/${ctx.workspace.id}/tags`, {
      token: ctx.user.token,
      body: { name: unique('repo'), color: '#ABCDEF' },
    });

    const repository = new WorkspaceRepository(AppDataSource.getRepository(Workspace));
    const full = await repository.findFullData(ctx.workspace.id);

    expect(full.workspace.id).toBe(ctx.workspace.id);
    expect(full.members.some((member) => member.user_id === ctx.user.user.id)).toBe(true);
    expect(full.tags.length).toBeGreaterThan(0);
    expect(full.priorities.some((priority) => priority.code === 'medium')).toBe(true);
  });

  it('informa que o workspace não existe', async () => {
    const repository = new WorkspaceRepository(AppDataSource.getRepository(Workspace));
    await expect(repository.findFullData(UNKNOWN_UUID)).rejects.toBeInstanceOf(NotFoundError);
  });
});
