import type { Repository } from 'typeorm';
import type { CreateListInput, UpdateListInput, UpdateListPositionsInput } from '../../domain/index';
import { NotFoundError } from '../../shared/index';
import { type List } from '../entities/list.entity';
import type { CardWithCount } from '../entities/card.entity';

export class ListRepository {
  constructor(private readonly repository: Repository<List>) {}

  async findById(id: string): Promise<List | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<List> {
    const list = await this.findById(id);
    if (!list) throw new NotFoundError('List not found');
    return list;
  }

  async findByWorkspace(workspaceId: string): Promise<List[]> {
    const qb = this.repository
      .createQueryBuilder('list')
      .leftJoinAndSelect('list.cards', 'card')
      .where('list.workspace_id = :workspaceId', { workspaceId })
      .orderBy('list.position', 'ASC')
      .addOrderBy('card.position', 'ASC')
      .addSelect((sq) => sq.select('COUNT(*)').from('comments', 'c').where('c.card_id = card.id'), 'card__comment_count');

    const results = await qb.getRawAndEntities();

    const map: Record<string, number> = {};
    for (const raw of results.raw) {
      if (raw.card__comment_count !== null && raw.card_id) {
        map[raw.card_id] = Number(raw.card__comment_count);
      }
    }

    for (const list of results.entities) {
      for (const card of list.cards) {
        (card as CardWithCount).comment_count = map[card.id] ?? 0;
      }
    }

    return results.entities;
  }

  async create(userId: string, input: CreateListInput & { workspace_id: string }): Promise<List> {
    const list = this.repository.create({ ...input, created_by: userId });
    return this.repository.save(list);
  }

  async update(id: string, input: UpdateListInput): Promise<List> {
    const list = await this.findByIdOrFail(id);
    Object.assign(list, input);
    return this.repository.save(list);
  }

  async updatePositions(updates: UpdateListPositionsInput): Promise<void> {
    if (!updates.length) return;
    const ids = updates.map((u) => u.id);
    const positions = updates.map((u) => u.position);
    await this.repository.query(
      `UPDATE lists AS l
       SET position = d.position::float8
       FROM (
         SELECT unnest($1::uuid[])   AS id,
                unnest($2::float8[]) AS position
       ) AS d
       WHERE l.id = d.id`,
      [ids, positions],
    );
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (!result.affected) throw new NotFoundError('List not found');
  }
}
