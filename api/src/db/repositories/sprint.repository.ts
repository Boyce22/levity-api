import { IsNull, type Repository } from 'typeorm';
import type { CreateSprintInput, UpdateSprintInput } from '../../domain/index';
import { NotFoundError } from '../../shared/index';
import { type Sprint } from '../entities/sprint.entity';
import { type SprintCard } from '../entities/sprint-card.entity';

export interface CreateSprintData extends CreateSprintInput {
  workspace_id: string;
  created_by: string;
}

export class SprintRepository {
  constructor(
    private readonly sprintRepo: Repository<Sprint>,
    private readonly sprintCardRepo: Repository<SprintCard>,
  ) {}

  async findByWorkspace(workspaceId: string): Promise<Sprint[]> {
    return this.sprintRepo.find({
      where: { workspace_id: workspaceId },
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

  async findActiveByWorkspace(workspaceId: string): Promise<Sprint | null> {
    return this.sprintRepo.findOne({ where: { workspace_id: workspaceId, status: 'active' } });
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

  async addCard(sprintId: string, cardId: string, position: number): Promise<SprintCard> {
    const sc = this.sprintCardRepo.create({ sprint_id: sprintId, card_id: cardId, position });
    return this.sprintCardRepo.save(sc);
  }

  async removeCard(sprintId: string, cardId: string): Promise<void> {
    await this.sprintCardRepo.update(
      { sprint_id: sprintId, card_id: cardId, removed_at: IsNull() },
      { removed_at: new Date() },
    );
  }

  async carryOverCard(fromSprintId: string, toSprintId: string, cardId: string): Promise<SprintCard> {
    const existing = await this.sprintCardRepo.findOne({
      where: { sprint_id: fromSprintId, card_id: cardId, removed_at: IsNull() },
    });

    if (existing) {
      existing.removed_at = new Date();
      existing.moved_to_sprint_id = toSprintId;
      await this.sprintCardRepo.save(existing);
    }

    const newSc = this.sprintCardRepo.create({ sprint_id: toSprintId, card_id: cardId, position: 0 });
    return this.sprintCardRepo.save(newSc);
  }

  async reorderCards(sprintId: string, updates: { id: string; position: number }[]): Promise<void> {
    if (updates.length === 0) return;

    const ids = updates.map((u) => u.id);
    const positions = updates.map((u) => u.position);

    await this.sprintCardRepo.query(
      `UPDATE sprint_cards SET position = data.pos
       FROM (SELECT unnest($1::uuid[]) AS id, unnest($2::int[]) AS pos) AS data
       WHERE sprint_cards.id = data.id AND sprint_cards.sprint_id = $3`,
      [ids, positions, sprintId],
    );
  }

  async findSprintCards(sprintId: string): Promise<SprintCard[]> {
    return this.sprintCardRepo.find({
      where: { sprint_id: sprintId, removed_at: IsNull() },
      relations: ['card'],
      order: { position: 'ASC' },
    });
  }

  async findCardInActiveSprint(cardId: string): Promise<SprintCard | null> {
    return this.sprintCardRepo
      .createQueryBuilder('sc')
      .innerJoin('sc.sprint', 's')
      .where('sc.card_id = :cardId', { cardId })
      .andWhere('sc.removed_at IS NULL')
      .andWhere('s.status = :status', { status: 'active' })
      .getOne();
  }
}
