import { Repository } from 'typeorm';
import { WorkspaceTag } from '../entities/workspace-tag.entity';
import { NotFoundError } from '@errors';

export class WorkspaceTagRepository {
  constructor(private readonly repository: Repository<WorkspaceTag>) {}

  async findByWorkspace(workspaceId: string): Promise<WorkspaceTag[]> {
    return this.repository.find({ where: { workspace_id: workspaceId }, order: { name: 'ASC' } });
  }

  async create(workspaceId: string, name: string, color: string): Promise<WorkspaceTag> {
    const tag = this.repository.create({ workspace_id: workspaceId, name, color });
    return this.repository.save(tag);
  }

  async delete(id: string): Promise<void> {
    const tag = await this.repository.findOne({ where: { id } });
    if (!tag) throw new NotFoundError('Tag not found');
    await this.repository.delete(id);
  }
}
