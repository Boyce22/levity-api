import type { Repository } from 'typeorm';
import { NotFoundError } from '../../shared/index';
import { type IssueDiagram } from '../entities/issue-diagram.entity';

export class IssueDiagramRepository {
  constructor(private readonly repository: Repository<IssueDiagram>) {}

  async findByIssue(issueId: string): Promise<IssueDiagram | null> {
    return this.repository.findOne({ where: { issue_id: issueId } });
  }

  async upsert(issueId: string, data: object): Promise<IssueDiagram> {
    const entity = this.repository.create({ issue_id: issueId, data });
    await this.repository.upsert(entity, ['issue_id']);
    return this.repository.findOneOrFail({ where: { issue_id: issueId } });
  }

  async delete(issueId: string): Promise<void> {
    const result = await this.repository.delete({ issue_id: issueId });
    if (!result.affected) throw new NotFoundError('Diagram not found');
  }
}
