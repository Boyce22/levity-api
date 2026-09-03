import type { Repository } from 'typeorm';
import { NotFoundError } from '../../shared/index';
import { type Diagram } from '../entities/diagram.entity';

export class DiagramRepository {
  constructor(private readonly repository: Repository<Diagram>) {}

  async findByCard(cardId: string): Promise<Diagram | null> {
    return this.repository.findOne({ where: { card_id: cardId } });
  }

  async upsert(cardId: string, data: object): Promise<Diagram> {
    const entity = this.repository.create({ card_id: cardId, data });
    await this.repository.upsert(entity, ['card_id']);
    return this.repository.findOneOrFail({ where: { card_id: cardId } });
  }

  async delete(cardId: string): Promise<void> {
    const result = await this.repository.delete({ card_id: cardId });
    if (!result.affected) throw new NotFoundError('Diagram not found');
  }
}
