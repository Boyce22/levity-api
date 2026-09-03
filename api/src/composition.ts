import { env } from './config';
import { createLogger, type Logger } from './shared';
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
} from './db';
import { AppDataSource } from './db/data-source';
import {
  CompressorService,
  createStorageProvider,
} from './modules/files/storage';
import { UsersService } from './modules/users/users.service';
import { WorkspaceService } from './modules/workspaces/workspaces.service';
import { MembersService } from './modules/workspaces/members.service';
import { SettingsService } from './modules/workspaces/settings.service';
import { BoardService } from './modules/boards/board.service';
import { CommentsService } from './modules/boards/comments.service';
import { DiagramsService } from './modules/boards/diagrams.service';
import { FilesService } from './modules/files/files.service';
import { NotificationsService } from './modules/notifications/notifications.service';
import { SprintService } from './modules/sprints/sprints.service';

import { AuthService } from './modules/auth/auth.service';
import { createAuthenticate, type PreHandler } from './modules/auth/auth.middleware';
import { authRoutes } from './modules/auth/auth.controller';
import { usersRoutes } from './modules/users/users.controller';
import { workspaceRoutes } from './modules/workspaces/workspaces.controller';
import { membersRoutes } from './modules/workspaces/members.controller';
import { settingsRoutes } from './modules/workspaces/settings.controller';
import { boardRoutes } from './modules/boards/board.controller';
import { sprintRoutes } from './modules/sprints/sprints.controller';
import { commentsRoutes } from './modules/boards/comments.controller';
import { notificationsRoutes } from './modules/notifications/notifications.controller';
import { diagramsRoutes } from './modules/boards/diagrams.controller';
import { filesRoutes } from './modules/files/files.controller';

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
