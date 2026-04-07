import { Router } from 'express';
import { authRouter } from '@/modules/auth/auth.factory';
import { usersRouter } from '@/modules/users/users.factory';
import { workspaceRouter, membersRouter, settingsRouter } from '@/modules/workspaces/workspace.factory';
import { boardRouter } from '@/modules/boards/board.factory';
import { commentsRouter } from '@/modules/comments/comments.factory';
import { notificationsRouter } from '@/modules/notifications/notifications.factory';
import { diagramsRouter } from '@/modules/diagrams/diagrams.factory';
import { filesRouter } from '@/modules/files/files.factory';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/workspaces', workspaceRouter);
router.use('/workspaces/:id', membersRouter);
router.use('/workspaces/:id', settingsRouter);
router.use('/workspaces/:workspaceId', boardRouter);
router.use('/comments', commentsRouter);
router.use('/notifications', notificationsRouter);
router.use('/diagrams', diagramsRouter);
router.use('/files', filesRouter);

export default router;
