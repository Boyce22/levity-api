import { BadRequestError, ConflictError, NotFoundError } from '../../shared/index';
import type {
  CreateSprintInput,
  UpdateSprintInput,
  CompleteSprintInput,
  ReorderSprintIssuesInput,
  SprintResponse,
  SprintIssueResponse,
} from '../../contracts/index';
import {
  Sprint,
  SprintIssue,
  SprintRepository,
  type BoardMemberRepository,
  type TransactionManager,
} from '../../db/index';

export class SprintService {
  constructor(
    private readonly sprintRepository: SprintRepository,
    private readonly memberRepository: BoardMemberRepository,
    private readonly transactionManager: TransactionManager,
  ) {}

  async getSprintsByBoard(boardId: string, userId: string): Promise<SprintResponse[]> {
    await this.memberRepository.assertMember(userId, boardId);
    const sprints = await this.sprintRepository.findByBoard(boardId);
    return sprints.map((s) => toSprintResponse(s));
  }

  async getSprintById(boardId: string, sprintId: string, userId: string): Promise<SprintResponse> {
    await this.memberRepository.assertMember(userId, boardId);
    const sprint = await this.requireSprintOnBoard(boardId, sprintId);
    const sprintIssues = await this.sprintRepository.findSprintIssues(sprintId);
    return toSprintResponse(sprint, sprintIssues);
  }

  async getActiveSprint(boardId: string, userId: string): Promise<SprintResponse | null> {
    await this.memberRepository.assertMember(userId, boardId);
    const sprint = await this.sprintRepository.findActiveByBoard(boardId);
    if (!sprint) return null;
    return toSprintResponse(sprint);
  }

  async createSprint(boardId: string, data: CreateSprintInput, userId: string): Promise<SprintResponse> {
    await this.memberRepository.assertWrite(userId, boardId);
    const sprint = await this.sprintRepository.create({
      ...data,
      board_id: boardId,
      created_by: userId,
    });
    return toSprintResponse(sprint);
  }

  async updateSprint(boardId: string, sprintId: string, data: UpdateSprintInput, userId: string): Promise<SprintResponse> {
    await this.memberRepository.assertWrite(userId, boardId);
    await this.requireSprintOnBoard(boardId, sprintId);
    const updated = await this.sprintRepository.update(sprintId, data);
    return toSprintResponse(updated);
  }

  async deleteSprint(boardId: string, sprintId: string, userId: string): Promise<void> {
    await this.memberRepository.assertWrite(userId, boardId);
    const sprint = await this.requireSprintOnBoard(boardId, sprintId);

    if (sprint.status !== 'planning') {
      throw new BadRequestError('Only sprints with status "planning" can be deleted');
    }

    await this.sprintRepository.delete(sprintId);
  }

  async activateSprint(boardId: string, sprintId: string, userId: string): Promise<SprintResponse> {
    await this.memberRepository.assertWrite(userId, boardId);
    const sprint = await this.requireSprintOnBoard(boardId, sprintId);

    if (sprint.status !== 'planning') {
      throw new BadRequestError('Only sprints with status "planning" can be activated');
    }

    const activeSprint = await this.sprintRepository.findActiveByBoard(boardId);
    if (activeSprint) {
      throw new ConflictError('already an active sprint on this board');
    }

    const updated = await this.sprintRepository.update(sprintId, { status: 'active' });
    return toSprintResponse(updated);
  }

  async completeSprint(
    boardId: string,
    sprintId: string,
    data: CompleteSprintInput,
    userId: string,
  ): Promise<SprintResponse> {
    await this.memberRepository.assertWrite(userId, boardId);
    const sprint = await this.requireSprintOnBoard(boardId, sprintId);

    if (sprint.status !== 'active') {
      throw new BadRequestError('Only active sprints can be completed');
    }

    if (data.to_sprint_id) {
      await this.requireSprintOnBoard(boardId, data.to_sprint_id);
    }

    const updated = await this.transactionManager.runInTransaction(async (manager) => {
      const sprintRepository = new SprintRepository(
        manager.getRepository(Sprint),
        manager.getRepository(SprintIssue),
      );

      const sprintIssues = await sprintRepository.findSprintIssues(sprintId);
      const completedIssues = sprintIssues.filter((si) => (si.issue?.progress ?? 0) === 100);

      let velocityPoints: number;
      switch (sprint.tracking_mode) {
        case 'points':
          velocityPoints = completedIssues.reduce((sum, si) => sum + (si.issue?.story_points ?? 0), 0);
          break;
        case 'hours':
          velocityPoints = completedIssues.reduce((sum, si) => sum + (si.issue?.estimated_hours ?? 0), 0);
          break;
        case 'count':
        default:
          velocityPoints = completedIssues.length;
      }

      if (data.to_sprint_id) {
        const toSprintId = data.to_sprint_id;
        const incompleteIssues = sprintIssues.filter((si) => (si.issue?.progress ?? 0) < 100);
        for (const si of incompleteIssues) {
          await sprintRepository.carryOverIssue(sprintId, toSprintId, si.issue_id);
        }
      }

      return sprintRepository.update(sprintId, {
        status: 'completed',
        velocity_points: velocityPoints,
      });
    });

    return toSprintResponse(updated);
  }

  async addIssueToSprint(
    boardId: string,
    sprintId: string,
    issueId: string,
    userId: string,
    position?: number,
  ): Promise<SprintIssueResponse> {
    await this.memberRepository.assertWrite(userId, boardId);
    await this.requireSprintOnBoard(boardId, sprintId);

    const existing = await this.sprintRepository.findIssueInActiveSprint(issueId);
    if (existing && existing.sprint_id !== sprintId) {
      throw new ConflictError('Issue is already assigned to another active sprint');
    }

    let nextPosition = position;
    if (nextPosition === undefined) {
      const lastIssues = await this.sprintRepository.findSprintIssues(sprintId);
      nextPosition = lastIssues.length > 0 ? Math.max(...lastIssues.map((si) => si.position)) + 1 : 0;
    }

    const si = await this.sprintRepository.addIssue(sprintId, issueId, nextPosition);
    return toSprintIssueResponse(si);
  }

  async removeIssueFromSprint(boardId: string, sprintId: string, issueId: string, userId: string): Promise<void> {
    await this.memberRepository.assertWrite(userId, boardId);
    await this.requireSprintOnBoard(boardId, sprintId);
    await this.sprintRepository.removeIssue(sprintId, issueId);
  }

  async reorderSprintIssues(
    boardId: string,
    sprintId: string,
    updates: ReorderSprintIssuesInput,
    userId: string,
  ): Promise<void> {
    await this.memberRepository.assertWrite(userId, boardId);
    await this.requireSprintOnBoard(boardId, sprintId);
    await this.sprintRepository.reorderIssues(sprintId, updates);
  }

  private async requireSprintOnBoard(boardId: string, sprintId: string): Promise<Sprint> {
    const sprint = await this.sprintRepository.findByIdOrFail(sprintId);
    if (sprint.board_id !== boardId) throw new NotFoundError('Sprint not found');
    return sprint;
  }
}

function toSprintResponse(sprint: Sprint, sprintIssues: SprintIssue[] = []): SprintResponse {
  const total = sprintIssues.length;
  const completed = sprintIssues.filter((si) => (si.issue?.progress ?? 0) === 100).length;

  return {
    id: sprint.id,
    board_id: sprint.board_id,
    name: sprint.name,
    goal: sprint.goal ?? undefined,
    start_date: sprint.start_date,
    end_date: sprint.end_date,
    status: sprint.status,
    tracking_mode: sprint.tracking_mode,
    capacity_points: sprint.capacity_points ?? undefined,
    velocity_points: sprint.velocity_points ?? undefined,
    created_by: sprint.created_by,
    created_at: sprint.created_at.toISOString(),
    issues: sprintIssues.length > 0 ? sprintIssues.map(toSprintIssueResponse) : undefined,
    total_issues: total,
    completed_issues: completed,
    progress_percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

function toSprintIssueResponse(si: SprintIssue): SprintIssueResponse {
  return {
    id: si.id,
    sprint_id: si.sprint_id,
    issue_id: si.issue_id,
    position: si.position,
    added_at: si.added_at.toISOString(),
    moved_to_sprint_id: si.moved_to_sprint_id ?? undefined,
    issue: {
      id: si.issue?.id ?? si.issue_id,
      content: si.issue?.content ?? '',
      story_points: si.issue?.story_points ?? undefined,
      estimated_hours: si.issue?.estimated_hours ?? undefined,
      column_id: si.issue?.column_id ?? '',
    },
  };
}
