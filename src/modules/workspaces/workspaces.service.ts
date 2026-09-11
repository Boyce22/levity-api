import type { Logger } from 'pino';
import {
  BoardColumnType,
  BoardRole,
  WorkspaceRole,
  type CreateBoardInput,
  type HomeBoardResponse,
  type WorkspaceInviteResponse,
  type WorkspaceResponse,
} from '../../contracts/index';
import { NotFoundError } from '../../shared/index';
import {
  Board,
  BoardColumn,
  BoardColumnRepository,
  BoardMember,
  BoardMemberRepository,
  BoardRepository,
  InviteBoardGrant,
  InviteBoardGrantRepository,
  Workspace,
  WorkspaceMember,
  WorkspaceMemberRepository,
  WorkspacePriority,
  WorkspacePriorityRepository,
  WorkspaceRepository,
  type WorkspaceInvite,
  type WorkspaceInviteRepository,
  type TransactionManager,
} from '../../db/index';

const DEFAULT_COLUMNS: { title: string; column_type: BoardColumnType; position: number }[] = [
  { title: 'To Do', column_type: BoardColumnType.TODO, position: 0 },
  { title: 'In Progress', column_type: BoardColumnType.IN_PROGRESS, position: 1 },
  { title: 'Review', column_type: BoardColumnType.REVIEW, position: 2 },
  { title: 'Done', column_type: BoardColumnType.DONE, position: 3 },
];

export class WorkspaceService {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly memberRepository: WorkspaceMemberRepository,
    private readonly inviteRepository: WorkspaceInviteRepository,
    private readonly grantRepository: InviteBoardGrantRepository,
    private readonly priorityRepository: WorkspacePriorityRepository,
    private readonly boardRepository: BoardRepository,
    private readonly boardMemberRepository: BoardMemberRepository,
    private readonly boardColumnRepository: BoardColumnRepository,
    private readonly transactionManager: TransactionManager,
    private readonly logger: Logger,
  ) {}

  async getWorkspaces(userId: string): Promise<WorkspaceResponse[]> {
    const workspaces = await this.workspaceRepository.findByUser(userId);
    return workspaces.map(toWorkspaceResponse);
  }

  async create(userId: string, name: string): Promise<WorkspaceResponse> {
    const workspace = await this.transactionManager.runInTransaction(async (manager) => {
      const workspaceRepository = new WorkspaceRepository(manager.getRepository(Workspace));
      const memberRepository = new WorkspaceMemberRepository(manager.getRepository(WorkspaceMember));
      const priorityRepository = new WorkspacePriorityRepository(manager.getRepository(WorkspacePriority));
      const boardRepository = new BoardRepository(manager.getRepository(Board));
      const boardColumnRepository = new BoardColumnRepository(manager.getRepository(BoardColumn));
      const boardMemberRepository = new BoardMemberRepository(manager.getRepository(BoardMember));

      const createdWorkspace = await workspaceRepository.create(name, userId);
      await memberRepository.add(createdWorkspace.id, userId, WorkspaceRole.OWNER);
      await priorityRepository.seedSystemPriorities(createdWorkspace.id, userId);

      await seedBoard(
        { boardRepository, boardColumnRepository, boardMemberRepository },
        createdWorkspace.id,
        createdWorkspace.name,
        userId,
        0,
      );
      return createdWorkspace;
    });

    this.logger.info({ workspaceId: workspace.id, userId }, 'Workspace created');
    return toWorkspaceResponse(workspace);
  }

  async rename(userId: string, workspaceId: string, name: string): Promise<WorkspaceResponse> {
    await this.memberRepository.assertRole(userId, workspaceId, WorkspaceRole.OWNER, WorkspaceRole.ADMIN);
    const workspace = await this.workspaceRepository.rename(workspaceId, name);
    return toWorkspaceResponse(workspace);
  }

  async delete(userId: string, workspaceId: string): Promise<void> {
    await this.memberRepository.assertRole(userId, workspaceId, WorkspaceRole.OWNER);
    await this.workspaceRepository.delete(workspaceId);
    this.logger.info({ workspaceId, userId }, 'Workspace deleted');
  }

  async getInvites(userId: string, workspaceId: string): Promise<WorkspaceInviteResponse[]> {
    await this.memberRepository.assertRole(userId, workspaceId, WorkspaceRole.OWNER, WorkspaceRole.ADMIN);
    const invites = await this.inviteRepository.findByWorkspace(workspaceId);
    return Promise.all(
      invites.map(async (invite) => {
        const grants = await this.grantRepository.findByInvite(invite.id);
        return toInviteResponse(invite, grants);
      }),
    );
  }

  async getHomeBoards(userId: string, workspaceId: string): Promise<HomeBoardResponse[]> {
    await this.memberRepository.assertMember(userId, workspaceId);
    const memberships = await this.boardMemberRepository.findActiveByUser(userId);
    return memberships
      .filter((membership) => membership.board.workspace_id === workspaceId)
      .map((membership) => toHomeBoardResponse(membership.board, membership.role));
  }

  async createBoard(userId: string, workspaceId: string, input: CreateBoardInput): Promise<HomeBoardResponse> {
    await this.memberRepository.assertRole(userId, workspaceId, WorkspaceRole.OWNER, WorkspaceRole.ADMIN);
    const existing = await this.boardRepository.findByWorkspace(workspaceId);
    const nextPosition = existing.reduce((max, board) => Math.max(max, board.position), -1) + 1;

    const board = await this.transactionManager.runInTransaction(async (manager) => {
      const boardRepository = new BoardRepository(manager.getRepository(Board));
      const boardColumnRepository = new BoardColumnRepository(manager.getRepository(BoardColumn));
      const boardMemberRepository = new BoardMemberRepository(manager.getRepository(BoardMember));
      return seedBoard(
        { boardRepository, boardColumnRepository, boardMemberRepository },
        workspaceId,
        input.name,
        userId,
        nextPosition,
      );
    });

    this.logger.info({ workspaceId, boardId: board.id, userId }, 'Board created');
    return toHomeBoardResponse(board, BoardRole.ADMIN);
  }

  async renameBoard(
    userId: string,
    workspaceId: string,
    boardId: string,
    name: string,
  ): Promise<HomeBoardResponse> {
    await this.memberRepository.assertRole(userId, workspaceId, WorkspaceRole.OWNER, WorkspaceRole.ADMIN);
    const board = await this.requireBoardInWorkspace(workspaceId, boardId);
    const renamed = await this.boardRepository.rename(board.id, name);
    const membership = await this.boardMemberRepository.findByBoardAndUser(board.id, userId);
    return toHomeBoardResponse(renamed, membership?.role ?? BoardRole.ADMIN);
  }

  async selfGrantBoard(userId: string, workspaceId: string, boardId: string): Promise<HomeBoardResponse> {
    await this.memberRepository.assertRole(userId, workspaceId, WorkspaceRole.OWNER, WorkspaceRole.ADMIN);
    const board = await this.requireBoardInWorkspace(workspaceId, boardId);
    const membership = await this.boardMemberRepository.upsertActive(boardId, userId, BoardRole.ADMIN);
    return toHomeBoardResponse(board, membership.role);
  }

  private async requireBoardInWorkspace(workspaceId: string, boardId: string) {
    const board = await this.boardRepository.findById(boardId);
    if (!board || board.workspace_id !== workspaceId || board.deleted_at) {
      throw new NotFoundError('Board not found');
    }
    return board;
  }
}

async function seedBoard(
  repos: {
    boardRepository: BoardRepository;
    boardColumnRepository: BoardColumnRepository;
    boardMemberRepository: BoardMemberRepository;
  },
  workspaceId: string,
  name: string,
  userId: string,
  position: number,
): Promise<Board> {
  const board = await repos.boardRepository.create({
    workspace_id: workspaceId,
    name,
    created_by: userId,
    position,
  });

  for (const column of DEFAULT_COLUMNS) {
    await repos.boardColumnRepository.create(userId, {
      board_id: board.id,
      title: column.title,
      position: column.position,
      column_type: column.column_type,
    });
  }

  await repos.boardMemberRepository.add(board.id, userId, BoardRole.ADMIN);
  return board;
}

function toHomeBoardResponse(board: Board, role: BoardRole): HomeBoardResponse {
  return {
    id: board.id,
    workspace_id: board.workspace_id,
    name: board.name,
    position: board.position,
    role,
  };
}

function toWorkspaceResponse(ws: Workspace): WorkspaceResponse {
  return {
    id: ws.id,
    name: ws.name,
    status: ws.status,
    created_by: ws.created_by,
    created_at: ws.created_at.toISOString(),
    updated_at: ws.updated_at.toISOString(),
  };
}

function toInviteResponse(i: WorkspaceInvite, grants: InviteBoardGrant[] = []): WorkspaceInviteResponse {
  return {
    id: i.id,
    workspace_id: i.workspace_id,
    token: i.token,
    created_by: i.created_by,
    max_uses: i.max_uses,
    current_uses: i.current_uses,
    expires_at: i.expires_at?.toISOString(),
    revoked_at: i.revoked_at?.toISOString(),
    workspace_role: i.workspace_role,
    created_at: i.created_at.toISOString(),
    grants: grants.map((g) => ({ board_id: g.board_id, board_role: g.board_role })),
  };
}
