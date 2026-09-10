import { IsNull, type Repository } from 'typeorm';
import { NotFoundError } from '../../shared/index';
import { type WorkspaceTag } from '../entities/workspace-tag.entity';

export class WorkspaceTagRepository {
  constructor(private readonly repository: Repository<WorkspaceTag>) {}

  async findByWorkspace(workspaceId: string): Promise<WorkspaceTag[]> {
    return this.repository.find({
      where: { workspace_id: workspaceId, deleted_at: IsNull() },
      order: { name: 'ASC' },
    });
  }

  async create(workspaceId: string, name: string, color: string, createdBy?: string): Promise<WorkspaceTag> {
    const tag = this.repository.create({
      workspace_id: workspaceId,
      name,
      color,
      created_by: createdBy,
    });
    return this.repository.save(tag);
  }

  async delete(id: string): Promise<void> {
    const tag = await this.repository.findOne({ where: { id, deleted_at: IsNull() } });
    if (!tag) throw new NotFoundError('Tag not found');
    tag.deleted_at = new Date();
    await this.repository.save(tag);
  }
}
