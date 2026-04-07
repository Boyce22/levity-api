import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { CreateNotificationInput, QueryNotificationsInput } from '../schemas';

export class NotificationRepository {
  constructor(private readonly repository: Repository<Notification>) {}

  async findForUser(
    userId: string,
    query: QueryNotificationsInput,
  ): Promise<{ data: Notification[]; total: number }> {
    const { read, page, limit } = query;
    const where: Record<string, unknown> = { user_id: userId };
    if (read !== undefined) where.read = read;

    const [data, total] = await this.repository.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async createMany(notifications: CreateNotificationInput[]): Promise<void> {
    const entities = this.repository.create(notifications as Partial<Notification>[]);
    await this.repository.save(entities);
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.repository.update({ id, user_id: userId }, { read: true });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repository.update({ user_id: userId, read: false }, { read: true });
  }
}
