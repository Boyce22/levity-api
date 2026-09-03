import { env } from '@levity/config';
import { createLogger, type Logger } from '@levity/observability';
import {
  Card,
  CardHistory,
  CardHistoryRepository,
  CardRepository,
  Comment,
  CommentRepository,
  Diagram,
  DiagramRepository,
  List,
  ListRepository,
  Notification,
  NotificationRepository,
  Sprint,
  SprintCard,
  SprintRepository,
  TransactionManager,
  User,
  UserRepository,
  Workspace,
  WorkspaceInvite,
  WorkspaceInviteRepository,
  WorkspaceMember,
  WorkspaceMemberRepository,
  WorkspacePriority,
  WorkspacePriorityRepository,
  WorkspaceRepository,
  WorkspaceTag,
  WorkspaceTagRepository,
} from '@levity/persistence';
import { AppDataSource } from './db/data-source';
import {
  CompressorService,
  createStorageProvider,
} from '@levity/storage';
import { UsersService } from './users/service';
import { WorkspaceService } from './workspaces/workspace';
import { MembersService } from './workspaces/members';
import { SettingsService } from './workspaces/settings';
import { BoardService } from './kanban/board';
import { CommentsService } from './kanban/comments';
import { DiagramsService } from './kanban/diagrams';
import { FilesService } from './files/service';
import { NotificationsService } from './notifications/service';
import { SprintService } from './sprints/service';

import { AuthService } from './auth/service';
import { createAuthenticate, type PreHandler } from './auth/middleware';
import { authRoutes } from './auth/routes';
import { usersRoutes } from './users/routes';
import { workspaceRoutes } from './workspaces/routes';
import { membersRoutes } from './workspaces/members.routes';
import { settingsRoutes } from './workspaces/settings.routes';
import { boardRoutes } from './kanban/routes';
import { sprintRoutes } from './sprints/routes';
import { commentsRoutes } from './kanban/comments.routes';
import { notificationsRoutes } from './notifications/routes';
import { diagramsRoutes } from './kanban/diagrams.routes';
import { filesRoutes } from './files/routes';

export type RoutePlugin = ReturnType<typeof authRoutes>;

export interface ApiContainer {
  logger: Logger;
  plugins: {
    auth: RoutePlugin;
    users: RoutePlugin;
    workspaces: RoutePlugin;
    members: RoutePlugin;
    settings: RoutePlugin;
    board: RoutePlugin;
    sprints: RoutePlugin;
    comments: RoutePlugin;
    notifications: RoutePlugin;
    diagrams: RoutePlugin;
    files: RoutePlugin;
  };
  close(): Promise<void>;
}

export function createApiContainer(): ApiContainer {
  const logger = createLogger({
    level: env.LOG_LEVEL,
    pretty: env.NODE_ENV !== 'production',
  });

  const transactionManager = new TransactionManager();
  const userRepository = new UserRepository(AppDataSource.getRepository(User));
  const workspaceRepository = new WorkspaceRepository(AppDataSource.getRepository(Workspace));
  const memberRepository = new WorkspaceMemberRepository(AppDataSource.getRepository(WorkspaceMember));
  const inviteRepository = new WorkspaceInviteRepository(AppDataSource.getRepository(WorkspaceInvite));
  const tagRepository = new WorkspaceTagRepository(AppDataSource.getRepository(WorkspaceTag));
  const priorityRepository = new WorkspacePriorityRepository(AppDataSource.getRepository(WorkspacePriority));
  const listRepository = new ListRepository(AppDataSource.getRepository(List));
  const cardRepository = new CardRepository(AppDataSource.getRepository(Card));
  const cardHistoryRepository = new CardHistoryRepository(AppDataSource.getRepository(CardHistory));
  const commentRepository = new CommentRepository(AppDataSource.getRepository(Comment));
  const notificationRepository = new NotificationRepository(AppDataSource.getRepository(Notification));
  const diagramRepository = new DiagramRepository(AppDataSource.getRepository(Diagram));
  const sprintRepository = new SprintRepository(
    AppDataSource.getRepository(Sprint),
    AppDataSource.getRepository(SprintCard),
  );

  const authService = new AuthService(
    userRepository,
    logger.child({ name: 'auth' }),
    env.JWT_SECRET,
    env.JWT_EXPIRES_IN,
  );
  const authenticate: PreHandler = createAuthenticate(authService);

  const filesService = new FilesService(
    createStorageProvider(env),
    new CompressorService(),
    memberRepository,
    logger.child({ name: 'files' }),
  );
  const usersService = new UsersService(userRepository, filesService, logger.child({ name: 'users' }));
  const workspaceService = new WorkspaceService(
    workspaceRepository,
    memberRepository,
    inviteRepository,
    transactionManager,
    logger.child({ name: 'workspaces' }),
  );
  const membersService = new MembersService(
    memberRepository,
    inviteRepository,
    transactionManager,
    logger.child({ name: 'members' }),
  );
  const settingsService = new SettingsService(
    tagRepository,
    priorityRepository,
    memberRepository,
    logger.child({ name: 'settings' }),
  );
  const boardService = new BoardService(
    listRepository,
    cardRepository,
    memberRepository,
    workspaceRepository,
    cardHistoryRepository,
    filesService,
    transactionManager,
    logger.child({ name: 'boards' }),
  );
  const sprintService = new SprintService(sprintRepository, memberRepository);
  const commentsService = new CommentsService(
    commentRepository,
    cardRepository,
    listRepository,
    memberRepository,
    transactionManager,
    logger.child({ name: 'comments' }),
  );
  const notificationsService = new NotificationsService(notificationRepository);
  const diagramsService = new DiagramsService(
    diagramRepository,
    cardRepository,
    listRepository,
    memberRepository,
  );

  return {
    logger,
    plugins: {
      auth: authRoutes(authService),
      users: usersRoutes(usersService, authenticate),
      workspaces: workspaceRoutes(workspaceService, membersService, authenticate),
      members: membersRoutes(membersService, authenticate),
      settings: settingsRoutes(settingsService, authenticate),
      board: boardRoutes(boardService, authenticate),
      sprints: sprintRoutes(sprintService, authenticate),
      comments: commentsRoutes(commentsService, authenticate),
      notifications: notificationsRoutes(notificationsService, authenticate),
      diagrams: diagramsRoutes(diagramsService, authenticate),
      files: filesRoutes(filesService, authenticate),
    },
    async close(): Promise<void> {
      /* Redis / queues when they exist */
    },
  };
}
