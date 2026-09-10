import { IsNull, type Repository } from 'typeorm';
import { CatalogStatus } from '../../contracts/index';
import { NotFoundError, ConflictError } from '../../shared/index';
import { type WorkspacePriority } from '../entities/workspace-priority.entity';

const SYSTEM_PRIORITIES = [
  { code: 'low', name: 'LOW', color: '#94A3B8', icon: 'arrow-down', position: 0 },
  { code: 'medium', name: 'MEDIUM', color: '#3B82F6', icon: 'minus', position: 1 },
  { code: 'high', name: 'HIGH', color: '#F97316', icon: 'arrow-up', position: 2 },
  { code: 'critical', name: 'CRITICAL', color: '#EF4444', icon: 'alert-circle', position: 3 },
] as const;

export type CreatePriorityData = {
  name: string;
  color: string;
  icon: string;
  position?: number;
  code?: string | null;
  is_system?: boolean;
  created_by?: string | null;
};

export class WorkspacePriorityRepository {
  constructor(private readonly repository: Repository<WorkspacePriority>) {}

  async findByWorkspace(workspaceId: string): Promise<WorkspacePriority[]> {
    return this.repository.find({
      where: { workspace_id: workspaceId, deleted_at: IsNull() },
      order: { position: 'ASC' },
    });
  }

  async findSystemByCode(workspaceId: string, code: string): Promise<WorkspacePriority | null> {
    return this.repository.findOne({
      where: { workspace_id: workspaceId, code, is_system: true, deleted_at: IsNull() },
    });
  }

  async seedSystemPriorities(workspaceId: string, createdBy: string): Promise<WorkspacePriority[]> {
    const rows = SYSTEM_PRIORITIES.map((p) =>
      this.repository.create({
        workspace_id: workspaceId,
        name: p.name,
        color: p.color,
        icon: p.icon,
        position: p.position,
        code: p.code,
        is_system: true,
        status: CatalogStatus.ACTIVE,
        created_by: createdBy,
      }),
    );
    return this.repository.save(rows);
  }

  async create(workspaceId: string, input: CreatePriorityData): Promise<WorkspacePriority> {
    const priority = this.repository.create({ workspace_id: workspaceId, ...input });
    return this.repository.save(priority);
  }

  async delete(id: string): Promise<void> {
    const priority = await this.repository.findOne({ where: { id, deleted_at: IsNull() } });
    if (!priority) throw new NotFoundError('Priority not found');
    if (priority.is_system) throw new ConflictError('Cannot delete a system priority');
    priority.deleted_at = new Date();
    await this.repository.save(priority);
  }
}
