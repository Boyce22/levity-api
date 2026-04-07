import pino from 'pino';
import { AppDataSource } from '@config';
import { Comment } from './entities/comment.entity';
import { Notification } from '@/modules/notifications/entities/notification.entity';
import { CommentRepository } from './repositories/comment.repository';
import { NotificationRepository } from '@/modules/notifications/repositories/notification.repository';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { cardRepository, listRepository } from '@/modules/boards/board.factory';
import { memberRepository } from '@/modules/workspaces/workspace.factory';

const logger = pino({ name: 'comments' });

const commentRepository = new CommentRepository(AppDataSource.getRepository(Comment));
const notificationRepository = new NotificationRepository(AppDataSource.getRepository(Notification));

const commentsService = new CommentsService(
  commentRepository,
  cardRepository,
  listRepository,
  memberRepository,
  notificationRepository,
  logger,
);

export const commentsController = new CommentsController(commentsService);
export const commentsRouter = commentsController.router;
