import type { Repository } from 'typeorm';
import { NotFoundError } from '../../shared/index';
import { type Workspace } from '../entities/workspace.entity';
import { type WorkspaceMember } from '../entities/workspace-member.entity';
import { type WorkspaceTag } from '../entities/workspace-tag.entity';
import { type WorkspacePriority } from '../entities/workspace-priority.entity';

export interface WorkspaceFullData {
  workspace: Workspace;
  members: WorkspaceMember[];
  tags: WorkspaceTag[];
  priorities: WorkspacePriority[];
}

export class WorkspaceRepository {
  constructor(private readonly repository: Repository<Workspace>) {}

  async findById(id: string): Promise<Workspace | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<Workspace> {
    const ws = await this.findById(id);
    if (!ws) throw new NotFoundError('Workspace not found');
    return ws;
  }

  async findFullData(workspaceId: string): Promise<WorkspaceFullData> {
    const qb = this.repository
      .createQueryBuilder('w')
      .leftJoin('workspace_members', 'm', 'm.workspace_id = w.id')
      .addSelect(['m.id', 'm.user_id', 'm.role', 'm.joined_at'])
      .leftJoin('workspace_tags', 't', 't.workspace_id = w.id')
      .addSelect(['t.id', 't.name', 't.color', 't.created_at'])
      .leftJoin('workspace_priorities', 'p', 'p.workspace_id = w.id')
      .addSelect(['p.id', 'p.name', 'p.color', 'p.icon', 'p.position', 'p.created_at'])
      .where('w.id = :id', { id: workspaceId });

    const raw = await qb.getRawAndEntities();

    if (!raw.entities.length) throw new NotFoundError('Workspace not found');

    const members: WorkspaceMember[] = [];
    const tags: WorkspaceTag[] = [];
    const priorities: WorkspacePriority[] = [];

    const seenM = new Set<string>();
    const seenT = new Set<string>();
    const seenP = new Set<string>();

    for (const row of raw.raw) {
      if (row.m_id && !seenM.has(row.m_id)) {
        seenM.add(row.m_id);
        members.push({
          id: row.m_id,
          workspace_id: row.w_id,
          user_id: row.m_user_id,
          role: row.m_role,
          joined_at: row.m_joined_at,
        } as WorkspaceMember);
      }
      if (row.t_id && !seenT.has(row.t_id)) {
        seenT.add(row.t_id);
        tags.push({
          id: row.t_id,
          workspace_id: row.w_id,
          name: row.t_name,
          color: row.t_color,
          created_at: row.t_created_at,
        } as WorkspaceTag);
      }
      if (row.p_id && !seenP.has(row.p_id)) {
        seenP.add(row.p_id);
        priorities.push({
          id: row.p_id,
          workspace_id: row.w_id,
          name: row.p_name,
          color: row.p_color,
          icon: row.p_icon,
          position: row.p_position,
          created_at: row.p_created_at,
        } as WorkspacePriority);
      }
    }

    return { workspace: raw.entities[0], members, tags, priorities };
  }

  async findByUser(userId: string): Promise<Workspace[]> {
    return this.repository
      .createQueryBuilder('workspace')
      .innerJoin('workspace_members', 'wm', 'wm.workspace_id = workspace.id')
      .where('wm.user_id = :userId', { userId })
      .orderBy('workspace.created_at', 'DESC')
      .getMany();
  }

  async create(name: string, createdBy: string): Promise<Workspace> {
    const ws = this.repository.create({ name, created_by: createdBy });
    return this.repository.save(ws);
  }

  async rename(id: string, name: string): Promise<Workspace> {
    const ws = await this.findByIdOrFail(id);
    ws.name = name;
    return this.repository.save(ws);
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (!result.affected) throw new NotFoundError('Workspace not found');
  }
}
