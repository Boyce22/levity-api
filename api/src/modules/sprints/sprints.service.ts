import { BadRequestError, ConflictError } from '../../shared/index';
import type {
  CreateSprintInput,
  UpdateSprintInput,
  CompleteSprintInput,
  ReorderSprintCardsInput,
  SprintResponse,
  SprintCardResponse,
} from '../../domain/index';
import type {
  Sprint,
  SprintCard,
  SprintRepository,
  WorkspaceMemberRepository,
} from '../../db/index';

export class SprintService {
  constructor(
    private readonly sprintRepository: SprintRepository,
    private readonly memberRepository: WorkspaceMemberRepository,
  ) {}

  async getSprintsByWorkspace(workspaceId: string, userId: string): Promise<SprintResponse[]> {
    await this.memberRepository.assertMember(userId, workspaceId);
    const sprints = await this.sprintRepository.findByWorkspace(workspaceId);
    return sprints.map((s) => toSprintResponse(s));
  }

  async getSprintById(sprintId: string, userId: string): Promise<SprintResponse> {
    const sprint = await this.sprintRepository.findByIdOrFail(sprintId);
    await this.memberRepository.assertMember(userId, sprint.workspace_id);
    const sprintCards = await this.sprintRepository.findSprintCards(sprintId);
    return toSprintResponse(sprint, sprintCards);
  }

  async getActiveSprint(workspaceId: string, userId: string): Promise<SprintResponse | null> {
    await this.memberRepository.assertMember(userId, workspaceId);
    const sprint = await this.sprintRepository.findActiveByWorkspace(workspaceId);
    if (!sprint) return null;
    return toSprintResponse(sprint);
  }

  async createSprint(workspaceId: string, data: CreateSprintInput, userId: string): Promise<SprintResponse> {
    await this.memberRepository.assertMember(userId, workspaceId);
    const sprint = await this.sprintRepository.create({
      ...data,
      workspace_id: workspaceId,
      created_by: userId,
    });
    return toSprintResponse(sprint);
  }

  async updateSprint(sprintId: string, data: UpdateSprintInput, userId: string): Promise<SprintResponse> {
    const sprint = await this.sprintRepository.findByIdOrFail(sprintId);
    await this.memberRepository.assertMember(userId, sprint.workspace_id);
    const updated = await this.sprintRepository.update(sprintId, data);
    return toSprintResponse(updated);
  }

  async deleteSprint(sprintId: string, userId: string): Promise<void> {
    const sprint = await this.sprintRepository.findByIdOrFail(sprintId);
    await this.memberRepository.assertMember(userId, sprint.workspace_id);

    if (sprint.status !== 'planning') {
      throw new BadRequestError('Only sprints with status "planning" can be deleted');
    }

    await this.sprintRepository.delete(sprintId);
  }

  async activateSprint(sprintId: string, userId: string): Promise<SprintResponse> {
    const sprint = await this.sprintRepository.findByIdOrFail(sprintId);
    await this.memberRepository.assertMember(userId, sprint.workspace_id);

    if (sprint.status !== 'planning') {
      throw new BadRequestError('Only sprints with status "planning" can be activated');
    }

    const activeSprint = await this.sprintRepository.findActiveByWorkspace(sprint.workspace_id);
    if (activeSprint) {
      throw new ConflictError('There is already an active sprint in this workspace');
    }

    const updated = await this.sprintRepository.update(sprintId, { status: 'active' });
    return toSprintResponse(updated);
  }

  async completeSprint(sprintId: string, data: CompleteSprintInput, userId: string): Promise<SprintResponse> {
    const sprint = await this.sprintRepository.findByIdOrFail(sprintId);
    await this.memberRepository.assertMember(userId, sprint.workspace_id);

    if (sprint.status !== 'active') {
      throw new BadRequestError('Only active sprints can be completed');
    }

    const sprintCards = await this.sprintRepository.findSprintCards(sprintId);
    const completedCards = sprintCards.filter((sc) => (sc.card?.progress ?? 0) === 100);

    let velocityPoints: number;
    switch (sprint.tracking_mode) {
      case 'points':
        velocityPoints = completedCards.reduce((sum, sc) => sum + (sc.card?.story_points ?? 0), 0);
        break;
      case 'hours':
        velocityPoints = completedCards.reduce((sum, sc) => sum + (sc.card?.estimated_hours ?? 0), 0);
        break;
      case 'count':
      default:
        velocityPoints = completedCards.length;
    }

    if (data.to_sprint_id) {
      const toSprintId = data.to_sprint_id;
      const incompleteCards = sprintCards.filter((sc) => (sc.card?.progress ?? 0) < 100);
      await Promise.all(
        incompleteCards.map((sc) => this.sprintRepository.carryOverCard(sprintId, toSprintId, sc.card_id)),
      );
    }

    const updated = await this.sprintRepository.update(sprintId, {
      status: 'completed',
      velocity_points: velocityPoints,
    });

    return toSprintResponse(updated);
  }

  async addCardToSprint(sprintId: string, cardId: string, userId: string): Promise<SprintCardResponse> {
    const sprint = await this.sprintRepository.findByIdOrFail(sprintId);
    await this.memberRepository.assertMember(userId, sprint.workspace_id);

    const existing = await this.sprintRepository.findCardInActiveSprint(cardId);
    if (existing && existing.sprint_id !== sprintId) {
      throw new ConflictError('Card is already assigned to another active sprint');
    }

    const lastCards = await this.sprintRepository.findSprintCards(sprintId);
    const position = lastCards.length > 0 ? Math.max(...lastCards.map((sc) => sc.position)) + 1 : 0;

    const sc = await this.sprintRepository.addCard(sprintId, cardId, position);
    return toSprintCardResponse(sc);
  }

  async removeCardFromSprint(sprintId: string, cardId: string, userId: string): Promise<void> {
    const sprint = await this.sprintRepository.findByIdOrFail(sprintId);
    await this.memberRepository.assertMember(userId, sprint.workspace_id);
    await this.sprintRepository.removeCard(sprintId, cardId);
  }

  async reorderSprintCards(
    sprintId: string,
    updates: ReorderSprintCardsInput,
    userId: string,
  ): Promise<void> {
    const sprint = await this.sprintRepository.findByIdOrFail(sprintId);
    await this.memberRepository.assertMember(userId, sprint.workspace_id);
    await this.sprintRepository.reorderCards(sprintId, updates);
  }
}

function toSprintResponse(sprint: Sprint, sprintCards: SprintCard[] = []): SprintResponse {
  const total = sprintCards.length;
  const completed = sprintCards.filter((sc) => (sc.card?.progress ?? 0) === 100).length;

  return {
    id: sprint.id,
    workspace_id: sprint.workspace_id,
    name: sprint.name,
    goal: sprint.goal ?? undefined,
    start_date: sprint.start_date,
    end_date: sprint.end_date,
    status: sprint.status,
    tracking_mode: sprint.tracking_mode,
    capacity_points: sprint.capacity_points ?? undefined,
    velocity_points: sprint.velocity_points,
    created_by: sprint.created_by,
    created_at: sprint.created_at.toISOString(),
    cards: sprintCards.length > 0 ? sprintCards.map(toSprintCardResponse) : undefined,
    total_cards: total,
    completed_cards: completed,
    progress_percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

function toSprintCardResponse(sc: SprintCard): SprintCardResponse {
  return {
    id: sc.id,
    sprint_id: sc.sprint_id,
    card_id: sc.card_id,
    position: sc.position,
    added_at: sc.added_at.toISOString(),
    moved_to_sprint_id: sc.moved_to_sprint_id,
    card: {
      id: sc.card?.id ?? sc.card_id,
      content: sc.card?.content ?? '',
      story_points: sc.card?.story_points,
      estimated_hours: sc.card?.estimated_hours,
      list_id: sc.card?.list_id ?? '',
    },
  };
}
