import { IsNull, type Repository } from 'typeorm';
import type { CreateSprintInput, UpdateSprintInput } from '../../contracts/index';
import { NotFoundError } from '../../shared/index';
import { type Sprint } from '../entities/sprint.entity';
import { type SprintIssue } from '../entities/sprint-issue.entity';

export interface CreateSprintData extends CreateSprintInput {
  board_id: string;
  created_by: string;
}

export class SprintRepository {
  constructor(
    private readonly sprintRepo: Repository<Sprint>,
    private readonly sprintIssueRepo: Repository<SprintIssue>,
  ) {}

  async findByBoard(boardId: string): Promise<Sprint[]> {
    return this.sprintRepo.find({
      where: { board_id: boardId },
      order: { created_at: 'DESC' },
    });
  }

  async findById(id: string): Promise<Sprint | null> {
    return this.sprintRepo.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<Sprint> {
    const sprint = await this.findById(id);
    if (!sprint) throw new NotFoundError('Sprint not found');
    return sprint;
  }

  async findActiveByBoard(boardId: string): Promise<Sprint | null> {
    return this.sprintRepo.findOne({ where: { board_id: boardId, status: 'active' } });
  }

  async create(data: CreateSprintData): Promise<Sprint> {
    const sprint = this.sprintRepo.create(data);
    return this.sprintRepo.save(sprint);
  }

  async update(id: string, data: UpdateSprintInput & Partial<Pick<Sprint, 'status' | 'velocity_points'>>): Promise<Sprint> {
    const sprint = await this.findByIdOrFail(id);
    Object.assign(sprint, data);
    return this.sprintRepo.save(sprint);
  }

  async delete(id: string): Promise<void> {
    const { affected } = await this.sprintRepo.delete(id);
    if (!affected) throw new NotFoundError('Sprint not found');
  }

  async addIssue(sprintId: string, issueId: string, position: number): Promise<SprintIssue> {
    const si = this.sprintIssueRepo.create({ sprint_id: sprintId, issue_id: issueId, position });
    return this.sprintIssueRepo.save(si);
  }

  async removeIssue(sprintId: string, issueId: string): Promise<void> {
    await this.sprintIssueRepo.update(
      { sprint_id: sprintId, issue_id: issueId, removed_at: IsNull() },
      { removed_at: new Date() },
    );
  }

  async carryOverIssue(fromSprintId: string, toSprintId: string, issueId: string): Promise<SprintIssue> {
    const existing = await this.sprintIssueRepo.findOne({
      where: { sprint_id: fromSprintId, issue_id: issueId, removed_at: IsNull() },
    });

    if (existing) {
      existing.removed_at = new Date();
      existing.moved_to_sprint_id = toSprintId;
      await this.sprintIssueRepo.save(existing);
    }

    const next = this.sprintIssueRepo.create({ sprint_id: toSprintId, issue_id: issueId, position: 0 });
    return this.sprintIssueRepo.save(next);
  }

  async reorderIssues(sprintId: string, updates: { id: string; position: number }[]): Promise<void> {
    if (updates.length === 0) return;

    const ids = updates.map((u) => u.id);
    const positions = updates.map((u) => u.position);

    await this.sprintIssueRepo.query(
      `UPDATE sprint_issues SET position = data.pos
       FROM (SELECT unnest($1::uuid[]) AS id, unnest($2::int[]) AS pos) AS data
       WHERE sprint_issues.id = data.id AND sprint_issues.sprint_id = $3`,
      [ids, positions, sprintId],
    );
  }

  async findSprintIssues(sprintId: string): Promise<SprintIssue[]> {
    return this.sprintIssueRepo.find({
      where: { sprint_id: sprintId, removed_at: IsNull() },
      relations: ['issue'],
      order: { position: 'ASC' },
    });
  }

  async findIssueInActiveSprint(issueId: string): Promise<SprintIssue | null> {
    return this.sprintIssueRepo
      .createQueryBuilder('si')
      .innerJoin('si.sprint', 's')
      .where('si.issue_id = :issueId', { issueId })
      .andWhere('si.removed_at IS NULL')
      .andWhere('s.status = :status', { status: 'active' })
      .getOne();
  }
}
