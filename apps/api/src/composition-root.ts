import { env } from '@levity/config';
import { createLogger, type Logger } from '@levity/observability';
import {
  AppDataSource,
  Card,
  CardRepository,
  Comment,
  CommentRepository,
  Diagram,
  DiagramRepository,
  List,
  ListRepository,
  Notification,
  NotificationRepository,
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
import {
  BoardService,
  CommentsService,
  DiagramsService,
  FilesService,
  MembersService,
  NotificationsService,
  SettingsService,
  UsersService,
  WorkspaceService,
} from '@levity/application';
import { CompressorService, createStorageProvider } from '@levity/storage';

import { AuthService } from './modules/auth/auth.service';
import { createAuthenticate, type PreHandler } from './modules/auth/auth.middleware';
import { authRoutes } from './modules/auth/auth.controller';
import { usersRoutes } from './modules/users/users.controller';
import { workspaceRoutes } from './modules/workspaces/workspace.controller';
import { membersRoutes } from './modules/workspaces/members.controller';
import { settingsRoutes } from './modules/workspaces/settings.controller';
import { boardRoutes } from './modules/boards/board.controller';
import { commentsRoutes } from './modules/comments/comments.controller';
import { notificationsRoutes } from './modules/notifications/notifications.controller';
import { diagramsRoutes } from './modules/diagrams/diagrams.controller';
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

  const userRepository = new UserRepository(AppDataSource.getRepository(User));
  const workspaceRepository = new WorkspaceRepository(AppDataSource.getRepository(Workspace));
  const memberRepository = new WorkspaceMemberRepository(AppDataSource.getRepository(WorkspaceMember));
  const inviteRepository = new WorkspaceInviteRepository(AppDataSource.getRepository(WorkspaceInvite));
  const tagRepository = new WorkspaceTagRepository(AppDataSource.getRepository(WorkspaceTag));
  const priorityRepository = new WorkspacePriorityRepository(AppDataSource.getRepository(WorkspacePriority));
  const listRepository = new ListRepository(AppDataSource.getRepository(List));
  const cardRepository = new CardRepository(AppDataSource.getRepository(Card));
  const commentRepository = new CommentRepository(AppDataSource.getRepository(Comment));
  const notificationRepository = new NotificationRepository(AppDataSource.getRepository(Notification));
  const diagramRepository = new DiagramRepository(AppDataSource.getRepository(Diagram));

  const authService = new AuthService(
    userRepository,
    logger.child({ name: 'auth' }),
    env.JWT_SECRET,
    env.JWT_EXPIRES_IN,
  );
  const authenticate: PreHandler = createAuthenticate(authService);

  const usersService = new UsersService(userRepository, logger.child({ name: 'users' }));
  const workspaceService = new WorkspaceService(
    workspaceRepository,
    memberRepository,
    inviteRepository,
    logger.child({ name: 'workspaces' }),
  );
  const membersService = new MembersService(
    memberRepository,
    inviteRepository,
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
    logger.child({ name: 'boards' }),
  );
  const commentsService = new CommentsService(
    commentRepository,
    cardRepository,
    listRepository,
    memberRepository,
    notificationRepository,
    logger.child({ name: 'comments' }),
  );
  const notificationsService = new NotificationsService(notificationRepository);
  const diagramsService = new DiagramsService(
    diagramRepository,
    cardRepository,
    listRepository,
    memberRepository,
  );
  const filesService = new FilesService(
    createStorageProvider(env),
    new CompressorService(),
    memberRepository,
    logger.child({ name: 'files' }),
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
