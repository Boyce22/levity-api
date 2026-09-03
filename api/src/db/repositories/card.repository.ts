import type { Repository } from 'typeorm';
import type { CreateCardInput, UpdateCardInput, UpdateCardPositionsInput } from '../../domain/index';
import { NotFoundError } from '../../shared/index';
import { type Card } from '../entities/card.entity';

export class CardRepository {
  constructor(private readonly repository: Repository<Card>) {}

  async findById(id: string): Promise<Card | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<Card> {
    const card = await this.findById(id);
    if (!card) throw new NotFoundError('Card not found');
    return card;
  }

  async findByList(listId: string): Promise<Card[]> {
    return this.repository.find({ where: { list_id: listId }, order: { position: 'ASC' } });
  }

  async create(userId: string, input: CreateCardInput): Promise<Card> {
    const card = this.repository.create({ ...input, created_by: userId });
    return this.repository.save(card);
  }

  async update(id: string, input: UpdateCardInput): Promise<Card> {
    const card = await this.findByIdOrFail(id);
    Object.assign(card, input);
    return this.repository.save(card);
  }

  async updatePositions(updates: UpdateCardPositionsInput): Promise<void> {
    if (!updates.length) return;
    const ids = updates.map((u) => u.id);
    const positions = updates.map((u) => u.position);
    const listIds = updates.map((u) => u.list_id ?? null);
    await this.repository.query(
      `UPDATE cards AS c
       SET position = d.position::float8,
           list_id  = COALESCE(d.list_id, c.list_id)
       FROM (
         SELECT unnest($1::uuid[])   AS id,
                unnest($2::float8[]) AS position,
                unnest($3::uuid[])   AS list_id
       ) AS d
       WHERE c.id = d.id`,
      [ids, positions, listIds],
    );
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (!result.affected) throw new NotFoundError('Card not found');
  }
}
