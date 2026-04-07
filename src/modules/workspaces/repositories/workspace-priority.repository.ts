import { Repository } from 'typeorm';
import { WorkspacePriority } from '../entities/workspace-priority.entity';
import { CreatePriorityInput } from '../schemas';
import { NotFoundError } from '@errors';

export class WorkspacePriorityRepository {
  constructor(private readonly repository: Repository<WorkspacePriority>) {}

  async findByWorkspace(workspaceId: string): Promise<WorkspacePriority[]> {
    return this.repository.find({ where: { workspace_id: workspaceId }, order: { position: 'ASC' } });
  }

  async create(workspaceId: string, input: CreatePriorityInput): Promise<WorkspacePriority> {
    const priority = this.repository.create({ workspace_id: workspaceId, ...input });
    return this.repository.save(priority);
  }

  async delete(id: string): Promise<void> {
    const priority = await this.repository.findOne({ where: { id } });
    if (!priority) throw new NotFoundError('Priority not found');
    await this.repository.delete(id);
  }
}
