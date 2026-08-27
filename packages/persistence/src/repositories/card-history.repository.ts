import type { Repository } from 'typeorm';
import { type CardHistory } from '../entities/card-history.entity';

export interface CardHistoryWithUser {
  id: string;
  card_id: string;
  created_by: string;
  action_type: string;
  field: string;
  old_val?: string;
  new_val?: string;
  created_at: Date;
  users?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export class CardHistoryRepository {
  constructor(private readonly repository: Repository<CardHistory>) {}

  async findByCard(cardId: string): Promise<CardHistoryWithUser[]> {
    const rows = await this.repository.manager
      .createQueryBuilder()
      .select([
        'h.id           AS id',
        'h.card_id      AS card_id',
        'h.created_by   AS created_by',
        'h.action_type  AS action_type',
        'h.field        AS field',
        'h.old_val      AS old_val',
        'h.new_val      AS new_val',
        'h.created_at   AS created_at',
        'u.id           AS user_id',
        'u.username     AS username',
        'u.display_name AS display_name',
        'u.avatar_url   AS avatar_url',
      ])
      .from('card_history', 'h')
      .leftJoin('users', 'u', 'u.id = h.created_by')
      .where('h.card_id = :cardId', { cardId })
      .orderBy('h.created_at', 'DESC')
      .getRawMany();

    return rows.map((r) => ({
      id: r.id,
      card_id: r.card_id,
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
            display_name: r.display_name ?? undefined,
            avatar_url: r.avatar_url ?? undefined,
          }
        : undefined,
    }));
  }

  async record(data: {
    card_id: string;
    created_by: string;
    action_type: string;
    field: string;
    old_val?: string;
    new_val?: string;
  }): Promise<CardHistory> {
    const entry = this.repository.create(data);
    return this.repository.save(entry);
  }
}
