import type { Repository } from 'typeorm';
import type { CreateNotificationInput, QueryNotificationsInput } from '../../contracts/index';
import { type Notification } from '../entities/notification.entity';

export class NotificationRepository {
  constructor(private readonly repository: Repository<Notification>) {}

  async findForUser(
    userId: string,
    query: QueryNotificationsInput,
  ): Promise<{ data: Notification[]; total?: number; nextCursor?: string }> {
    const { read, page, limit, cursor } = query;
    const where: Record<string, unknown> = { user_id: userId };
    if (read !== undefined) where.read = read;

    if (cursor) {
      const qb = this.repository
        .createQueryBuilder('notification')
        .where('notification.user_id = :userId', { userId })
        .andWhere('notification.created_at < :cursor', { cursor: new Date(cursor) })
        .orderBy('notification.created_at', 'DESC')
        .take(limit + 1);

      if (read !== undefined) {
        qb.andWhere('notification.read = :read', { read });
      }

      const results = await qb.getMany();
      const hasMore = results.length > limit;
      const data = hasMore ? results.slice(0, limit) : results;
      return {
        data,
        nextCursor: hasMore ? data[data.length - 1].created_at.toISOString() : undefined,
      };
    }

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
