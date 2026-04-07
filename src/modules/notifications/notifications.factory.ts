import { AppDataSource } from '@config';
import { Notification } from './entities/notification.entity';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

const notificationRepository = new NotificationRepository(AppDataSource.getRepository(Notification));
const notificationsService = new NotificationsService(notificationRepository);
export const notificationsController = new NotificationsController(notificationsService);
export const notificationsRouter = notificationsController.router;
