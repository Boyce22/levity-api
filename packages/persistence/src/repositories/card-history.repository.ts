import type { Repository } from 'typeorm';
import { type CardHistory } from '../entities/card-history.entity';

export class CardHistoryRepository {
  constructor(private readonly repository: Repository<CardHistory>) {}

  async findByCard(cardId: string): Promise<CardHistory[]> {
    return this.repository.find({ where: { card_id: cardId }, order: { created_at: 'DESC' } });
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
