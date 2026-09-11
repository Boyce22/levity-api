import type { Logger } from 'pino';
import type {
  CreateColumnInput,
  UpdateColumnInput,
  UpdateColumnPositionsInput,
  CreateIssueInput,
  UpdateIssueInput,
  UpdateIssuePositionsInput,
} from '../../contracts/boards/schemas';
import type {
  BoardDataResponse,
  BoardColumnResponse,
  IssueResponse,
  IssueEventResponse,
} from '../../contracts/boards/dtos';
import { NotificationType } from '../../contracts/index';
import { BadRequestError, NotFoundError } from '../../shared/index';
import {
  BoardColumn,
  BoardMember,
  Issue,
  IssueEvent,
  Notification,
  BoardColumnRepository,
  BoardMemberRepository,
  BoardRepository,
  IssueEventRepository,
  IssueRepository,
  NotificationRepository,
  type IssueWithCount,
  type TransactionManager,
  type WorkspacePriorityRepository,
  type WorkspaceTagRepository,
} from '../../db/index';
import type { FilesService } from '../files/files.service';

const TRACKED_FIELDS = [
  'content',
  'description',
  'progress',
  'due_date',
  'cover_url',
  'story_points',
  'estimated_hours',
  'priority_id',
  'tag_id',
] as const;

type TrackedField = (typeof TRACKED_FIELDS)[number];

export class BoardService {
  constructor(
    private readonly boardRepository: BoardRepository,
    private readonly boardColumnRepository: BoardColumnRepository,
    private readonly issueRepository: IssueRepository,
    private readonly issueEventRepository: IssueEventRepository,
    private readonly boardMemberRepository: BoardMemberRepository,
    private readonly priorityRepository: WorkspacePriorityRepository,
    private readonly filesService: FilesService,
    private readonly transactionManager: TransactionManager,
    private readonly logger: Logger,
    private readonly tagRepository: WorkspaceTagRepository,
  ) {}

  async getBoardData(userId: string, boardId: string): Promise<BoardDataResponse> {
    const board = await this.boardRepository.findByIdOrFail(boardId);
    await this.boardMemberRepository.assertMember(userId, boardId);

    const columns = await this.boardColumnRepository.findByBoard(boardId);
    const allIssues = columns.flatMap((c) => c.issues ?? []);
    const coverKeys = allIssues.filter((i) => i.cover_url).map((i) => i.cover_url!);
    const coverUrlMap = await this.filesService.resolveUrls(coverKeys);

    return {
      board: {
        id: board.id,
        workspace_id: board.workspace_id,
        name: board.name,
        position: board.position,
        created_by: board.created_by,
        created_at: board.created_at.toISOString(),
        updated_at: board.updated_at.toISOString(),
      },
      columns: columns.map((c) => toBoardColumnResponse(c, coverUrlMap)),
    };
  }

  async createColumn(userId: string, boardId: string, input: CreateColumnInput): Promise<BoardColumnResponse> {
    await this.boardRepository.findByIdOrFail(boardId);
    await this.boardMemberRepository.assertWrite(userId, boardId);
    const column = await this.boardColumnRepository.create(userId, { ...input, board_id: boardId });
    return toBoardColumnResponse(column);
  }

  async updateColumn(userId: string, boardId: string, columnId: string, input: UpdateColumnInput): Promise<BoardColumnResponse> {
    const column = await this.requireColumnOnBoard(columnId, boardId);
    await this.boardMemberRepository.assertWrite(userId, column.board_id);
    const updated = await this.boardColumnRepository.update(columnId, input);
    return toBoardColumnResponse(updated);
  }

  async updateColumnPositions(userId: string, boardId: string, updates: UpdateColumnPositionsInput): Promise<void> {
    await this.boardRepository.findByIdOrFail(boardId);
    await this.boardMemberRepository.assertWrite(userId, boardId);
    await this.boardColumnRepository.updatePositions(updates);
  }

  async deleteColumn(userId: string, boardId: string, columnId: string): Promise<void> {
    const column = await this.requireColumnOnBoard(columnId, boardId);
    await this.boardMemberRepository.assertWrite(userId, column.board_id);
    await this.boardColumnRepository.delete(columnId);
    this.logger.info({ columnId, userId }, 'Column deleted');
  }

  async createIssue(userId: string, boardId: string, input: CreateIssueInput): Promise<IssueResponse> {
    const column = await this.requireColumnOnBoard(input.column_id, boardId);
    const board = await this.boardRepository.findByIdOrFail(column.board_id);
    await this.boardMemberRepository.assertWrite(userId, board.id);
    await this.assertWipAllows(column, 1);

    const priorityId = input.priority_id ?? (await this.defaultPriorityId(board.workspace_id));
    await this.assertPriorityInWorkspace(board.workspace_id, priorityId);
    if (input.tag_id) {
      await this.assertTagInWorkspace(board.workspace_id, input.tag_id);
    }

    const issue = await this.transactionManager.runInTransaction(async (manager) => {
      const issueRepository = new IssueRepository(manager.getRepository(Issue));
      const issueEventRepository = new IssueEventRepository(manager.getRepository(IssueEvent));
      const notificationRepository = new NotificationRepository(manager.getRepository(Notification));
      const created = await issueRepository.create(userId, {
        content: input.content,
        column_id: input.column_id,
        position: input.position,
        description: input.description,
        priority_id: priorityId,
        tag_id: input.tag_id,
        assignee_id: input.assignee_id,
        story_points: input.story_points,
        estimated_hours: input.estimated_hours,
      });
      await issueEventRepository.record({
        issue_id: created.id,
        created_by: userId,
        action_type: 'created',
        field: 'issue',
      });
      if (input.assignee_id && input.assignee_id !== userId) {
        await notificationRepository.createMany([
          {
            user_id: input.assignee_id,
            actor_id: userId,
            issue_id: created.id,
            type: NotificationType.ASSIGNMENT,
          },
        ]);
      }
      return created;
    });

    return this.toIssueResponseWithCover(issue);
  }

  async updateIssue(userId: string, boardId: string, issueId: string, input: UpdateIssueInput): Promise<IssueResponse> {
    const issue = await this.issueRepository.findByIdOrFail(issueId);
    const column = await this.requireColumnOnBoard(issue.column_id, boardId);
    const board = await this.boardRepository.findByIdOrFail(column.board_id);
    await this.boardMemberRepository.assertWrite(userId, board.id);

    let workspaceId = board.workspace_id;
    const historyEntries: Array<Parameters<IssueEventRepository['record']>[0]> = [];

    if (input.assignee_id !== undefined && input.assignee_id !== issue.assignee_id) {
      historyEntries.push({
        issue_id: issueId,
        created_by: userId,
        action_type: 'assigned',
        field: 'assignee',
        old_val: issue.assignee_id ?? undefined,
        new_val: input.assignee_id ?? undefined,
      });
    }

    if (input.column_id !== undefined && input.column_id !== issue.column_id) {
      const newColumn = await this.boardColumnRepository.findByIdOrFail(input.column_id);
      const newBoard = await this.boardRepository.findByIdOrFail(newColumn.board_id);
      await this.boardMemberRepository.assertWrite(userId, newBoard.id);
      await this.assertWipAllows(newColumn, 1);
      workspaceId = newBoard.workspace_id;
      historyEntries.push({
        issue_id: issueId,
        created_by: userId,
        action_type: 'moved',
        field: newColumn.title,
      });
    }

    if (input.priority_id !== undefined) {
      await this.assertPriorityInWorkspace(workspaceId, input.priority_id);
    }
    if (input.tag_id) {
      await this.assertTagInWorkspace(workspaceId, input.tag_id);
    }

    const dueDate =
      input.due_date === undefined ? undefined : input.due_date === null ? null : new Date(input.due_date);

    for (const field of TRACKED_FIELDS) {
      if (!(field in input) || input[field] === undefined) continue;
      const oldVal = issue[field as TrackedField];
      const newVal = field === 'due_date' ? dueDate : input[field as TrackedField];
      const oldStr = toComparable(oldVal);
      const newStr = toComparable(newVal);
      if (oldStr !== newStr) {
        historyEntries.push({
          issue_id: issueId,
          created_by: userId,
          action_type: 'updated',
          field,
          old_val: oldStr || undefined,
          new_val: newStr || undefined,
        });
      }
    }

    const patch = {
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.cover_url !== undefined ? { cover_url: input.cover_url } : {}),
      ...(input.assignee_id !== undefined ? { assignee_id: input.assignee_id } : {}),
      ...(input.priority_id !== undefined ? { priority_id: input.priority_id } : {}),
      ...(input.tag_id !== undefined ? { tag_id: input.tag_id } : {}),
      ...(input.progress !== undefined ? { progress: input.progress } : {}),
      ...(dueDate !== undefined ? { due_date: dueDate } : {}),
      ...(input.column_id !== undefined ? { column_id: input.column_id } : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
      ...(input.story_points !== undefined ? { story_points: input.story_points } : {}),
      ...(input.estimated_hours !== undefined ? { estimated_hours: input.estimated_hours } : {}),
    };

    const updated = await this.transactionManager.runInTransaction(async (manager) => {
      const issueRepository = new IssueRepository(manager.getRepository(Issue));
      const issueEventRepository = new IssueEventRepository(manager.getRepository(IssueEvent));
      const notificationRepository = new NotificationRepository(manager.getRepository(Notification));
      const updatedIssue = await issueRepository.update(issueId, patch);
      if (historyEntries.length > 0) {
        await Promise.all(historyEntries.map((entry) => issueEventRepository.record(entry)));
      }
      if (
        input.assignee_id &&
        input.assignee_id !== issue.assignee_id &&
        input.assignee_id !== userId
      ) {
        await notificationRepository.createMany([
          {
            user_id: input.assignee_id,
            actor_id: userId,
            issue_id: issueId,
            type: NotificationType.ASSIGNMENT,
          },
        ]);
      }
      return updatedIssue;
    });

    return this.toIssueResponseWithCover(updated);
  }

  async updateIssuePositions(userId: string, boardId: string, updates: UpdateIssuePositionsInput): Promise<void> {
    await this.boardRepository.findByIdOrFail(boardId);
    await this.boardMemberRepository.assertWrite(userId, boardId);

    await this.transactionManager.runInTransaction(async (manager) => {
      const issueRepository = new IssueRepository(manager.getRepository(Issue));
      const columnRepository = new BoardColumnRepository(manager.getRepository(BoardColumn));
      const issueEventRepository = new IssueEventRepository(manager.getRepository(IssueEvent));
      const memberRepository = new BoardMemberRepository(manager.getRepository(BoardMember));

      await memberRepository.assertWrite(userId, boardId);

      const movingUpdates = updates.filter((u) => u.column_id);
      if (movingUpdates.length > 0) {
        const uniqueColumnIds = [...new Set(movingUpdates.map((u) => u.column_id!))];
        const [currentIssues, newColumns] = await Promise.all([
          Promise.all(movingUpdates.map((u) => issueRepository.findById(u.id))),
          Promise.all(uniqueColumnIds.map((id) => columnRepository.findById(id))),
        ]);

        for (const col of newColumns) {
          if (!col || col.board_id !== boardId) {
            throw new BadRequestError('Column does not belong to this board');
          }
        }

        const newcomersByColumn = new Map<string, number>();
        for (let i = 0; i < movingUpdates.length; i++) {
          const issue = currentIssues[i];
          const targetColumnId = movingUpdates[i].column_id!;
          if (issue && issue.column_id !== targetColumnId) {
            newcomersByColumn.set(targetColumnId, (newcomersByColumn.get(targetColumnId) ?? 0) + 1);
          }
        }
        for (const col of newColumns) {
          if (!col) continue;
          const extra = newcomersByColumn.get(col.id) ?? 0;
          if (extra) await this.assertWipAllows(col, extra, issueRepository);
        }

        const columnTitleMap = new Map(newColumns.filter(Boolean).map((c) => [c!.id, c!.title]));

        await Promise.all(
          movingUpdates
            .map((update, i) => ({ update, issue: currentIssues[i] }))
            .filter(({ update, issue }) => issue && issue.column_id !== update.column_id)
            .map(({ update }) =>
              issueEventRepository.record({
                issue_id: update.id,
                created_by: userId,
                action_type: 'moved',
                field: columnTitleMap.get(update.column_id!) ?? update.column_id!,
              }),
            ),
        );
      }

      await issueRepository.updatePositions(updates);
    });
  }

  async deleteIssue(userId: string, boardId: string, issueId: string): Promise<void> {
    const issue = await this.issueRepository.findByIdOrFail(issueId);
    const column = await this.requireColumnOnBoard(issue.column_id, boardId);
    await this.boardMemberRepository.assertWrite(userId, column.board_id);
    await this.issueRepository.delete(issueId);
    this.logger.info({ issueId, userId }, 'Issue deleted');
  }

  async getIssueEvents(userId: string, boardId: string, issueId: string): Promise<IssueEventResponse[]> {
    const issue = await this.issueRepository.findByIdOrFail(issueId);
    const column = await this.requireColumnOnBoard(issue.column_id, boardId);
    await this.boardMemberRepository.assertMember(userId, column.board_id);
    const events = await this.issueEventRepository.findByIssue(issueId);

    return events.map((h) => ({
      id: h.id,
      issue_id: h.issue_id,
      created_by: h.created_by,
      action_type: h.action_type,
      field: h.field,
      old_val: h.old_val,
      new_val: h.new_val,
      created_at: h.created_at.toISOString(),
      users: h.users,
    }));
  }

  private async assertWipAllows(
    column: BoardColumn,
    extra: number,
    issueRepository: IssueRepository = this.issueRepository,
  ): Promise<void> {
    if (column.wip_limit == null || extra <= 0) return;
    const count = await issueRepository.countByColumn(column.id);
    if (count + extra > column.wip_limit) {
      throw new BadRequestError('Column WIP limit reached');
    }
  }

  private async requireColumnOnBoard(columnId: string, boardId: string): Promise<BoardColumn> {
    const column = await this.boardColumnRepository.findByIdOrFail(columnId);
    if (column.board_id !== boardId) throw new NotFoundError('Column not found');
    return column;
  }

  private async defaultPriorityId(workspaceId: string): Promise<string> {
    const priority = await this.priorityRepository.findSystemByCode(workspaceId, 'medium');
    if (!priority) throw new BadRequestError('Default priority is not configured for this workspace');
    return priority.id;
  }

  private async assertPriorityInWorkspace(workspaceId: string, priorityId: string): Promise<void> {
    const priorities = await this.priorityRepository.findByWorkspace(workspaceId);
    if (!priorities.some((p) => p.id === priorityId)) {
      throw new BadRequestError('Priority does not belong to this workspace');
    }
  }

  private async assertTagInWorkspace(workspaceId: string, tagId: string): Promise<void> {
    const tags = await this.tagRepository.findByWorkspace(workspaceId);
    if (!tags.some((t) => t.id === tagId)) {
      throw new BadRequestError('Tag does not belong to this workspace');
    }
  }

  private async toIssueResponseWithCover(issue: Issue): Promise<IssueResponse> {
    const response = toIssueResponse(issue);
    response.cover_url = issue.cover_url ? await this.filesService.resolveUrl(issue.cover_url) : undefined;
    return response;
  }
}

function toComparable(value: unknown): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function toBoardColumnResponse(column: BoardColumn, coverUrlMap = new Map<string, string>()): BoardColumnResponse {
  return {
    id: column.id,
    title: column.title,
    position: column.position,
    wip_limit: column.wip_limit ?? undefined,
    column_type: column.column_type ?? undefined,
    board_id: column.board_id,
    created_by: column.created_by,
    created_at: column.created_at.toISOString(),
    issues: (column.issues ?? []).map((i) => toIssueResponse(i, coverUrlMap)),
  };
}

function toIssueResponse(issue: Issue, coverUrlMap = new Map<string, string>()): IssueResponse {
  return {
    id: issue.id,
    content: issue.content,
    position: issue.position,
    description: issue.description ?? undefined,
    cover_url: issue.cover_url ? coverUrlMap.get(issue.cover_url) : undefined,
    assignee_id: issue.assignee_id ?? undefined,
    priority_id: issue.priority_id,
    tag_id: issue.tag_id ?? undefined,
    progress: issue.progress ?? undefined,
    due_date: issue.due_date?.toISOString(),
    column_id: issue.column_id,
    created_by: issue.created_by,
    created_at: issue.created_at.toISOString(),
    comment_count: (issue as IssueWithCount).comment_count ?? 0,
    story_points: issue.story_points ?? undefined,
    estimated_hours: issue.estimated_hours ?? undefined,
  };
}
