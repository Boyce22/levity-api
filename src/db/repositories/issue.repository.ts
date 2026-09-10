import type { Repository } from 'typeorm';
import { NotFoundError } from '../../shared/index';
import { type Issue } from '../entities/issue.entity';

export type CreateIssueData = {
  content: string;
  column_id: string;
  position?: number;
  priority_id: string;
  tag_id?: string | null;
  description?: string | null;
  cover_url?: string | null;
  assignee_id?: string | null;
  progress?: number | null;
  due_date?: Date | null;
  story_points?: number | null;
  estimated_hours?: number | null;
};

export type UpdateIssueData = Partial<CreateIssueData>;

export type UpdateIssuePositionsInput = { id: string; position: number; column_id?: string | null }[];

export class IssueRepository {
  constructor(private readonly repository: Repository<Issue>) {}

  async findById(id: string): Promise<Issue | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<Issue> {
    const issue = await this.findById(id);
    if (!issue) throw new NotFoundError('Issue not found');
    return issue;
  }

  async findByColumn(columnId: string): Promise<Issue[]> {
    return this.repository.find({ where: { column_id: columnId }, order: { position: 'ASC' } });
  }

  async create(userId: string, input: CreateIssueData): Promise<Issue> {
    const issue = this.repository.create({ ...input, created_by: userId });
    return this.repository.save(issue);
  }

  async update(id: string, input: UpdateIssueData): Promise<Issue> {
    const issue = await this.findByIdOrFail(id);
    Object.assign(issue, input);
    return this.repository.save(issue);
  }

  async updatePositions(updates: UpdateIssuePositionsInput): Promise<void> {
    if (!updates.length) return;
    const ids = updates.map((u) => u.id);
    const positions = updates.map((u) => u.position);
    const columnIds = updates.map((u) => u.column_id ?? null);
    await this.repository.query(
      `UPDATE issues AS i
       SET position  = d.position::float8,
           column_id = COALESCE(d.column_id, i.column_id)
       FROM (
         SELECT unnest($1::uuid[])   AS id,
                unnest($2::float8[]) AS position,
                unnest($3::uuid[])   AS column_id
       ) AS d
       WHERE i.id = d.id`,
      [ids, positions, columnIds],
    );
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (!result.affected) throw new NotFoundError('Issue not found');
  }
}
