import type { Repository } from 'typeorm';
import { type IssueEvent } from '../entities/issue-event.entity';

export interface IssueEventWithUser {
  id: string;
  issue_id: string;
  created_by: string;
  action_type: string;
  field: string;
  old_val?: string;
  new_val?: string;
  created_at: Date;
  users?: {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

export class IssueEventRepository {
  constructor(private readonly repository: Repository<IssueEvent>) {}

  async findByIssue(issueId: string): Promise<IssueEventWithUser[]> {
    const rows = await this.repository.manager
      .createQueryBuilder()
      .select([
        'h.id           AS id',
        'h.issue_id     AS issue_id',
        'h.created_by   AS created_by',
        'h.action_type  AS action_type',
        'h.field        AS field',
        'h.old_val      AS old_val',
        'h.new_val      AS new_val',
        'h.created_at   AS created_at',
        'u.id           AS user_id',
        'u.username     AS username',
        'u.first_name   AS first_name',
        'u.last_name    AS last_name',
        'u.avatar_url   AS avatar_url',
      ])
      .from('issue_events', 'h')
      .leftJoin('users', 'u', 'u.id = h.created_by')
      .where('h.issue_id = :issueId', { issueId })
      .orderBy('h.created_at', 'DESC')
      .getRawMany();

    return rows.map((r) => ({
      id: r.id,
      issue_id: r.issue_id,
      created_by: r.created_by,
      action_type: r.action_type,
      field: r.field,
      old_val: r.old_val ?? undefined,
      new_val: r.new_val ?? undefined,
      created_at: r.created_at,
      users: r.user_id
        ? {
            id: r.user_id,
            username: r.username,
            first_name: r.first_name ?? undefined,
            last_name: r.last_name ?? undefined,
            avatar_url: r.avatar_url ?? undefined,
          }
        : undefined,
    }));
  }

  async record(data: {
    issue_id: string;
    created_by: string;
    action_type: string;
    field: string;
    old_val?: string;
    new_val?: string;
  }): Promise<IssueEvent> {
    const entry = this.repository.create(data);
    return this.repository.save(entry);
  }
}
