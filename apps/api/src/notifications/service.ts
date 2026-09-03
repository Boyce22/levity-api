import type { QueryNotificationsInput, NotificationResponse, PaginatedResponse } from '../domain/index';
import type { Notification, NotificationRepository } from '../db/index';

export class NotificationsService {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async getNotifications(
    userId: string,
    query: QueryNotificationsInput,
  ): Promise<PaginatedResponse<NotificationResponse>> {
    const { data, total, nextCursor } = await this.notificationRepository.findForUser(userId, query);
    const items = data.map(toNotificationResponse);

    if (query.cursor) {
      return { items, limit: query.limit, nextCursor };
    }

    const resolvedTotal = total ?? data.length;
    return {
      items,
      total: resolvedTotal,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(resolvedTotal / query.limit),
    };
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    await this.notificationRepository.markRead(notificationId, userId);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationRepository.markAllRead(userId);
  }
}

function toNotificationResponse(n: Notification): NotificationResponse {
  return {
    id: n.id,
    user_id: n.user_id,
    actor_id: n.actor_id,
    card_id: n.card_id,
    type: n.type,
    content: n.content,
    read: n.read,
    created_at: n.created_at.toISOString(),
  };
}
