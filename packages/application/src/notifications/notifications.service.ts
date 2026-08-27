import type { QueryNotificationsInput, NotificationResponse, PaginatedResponse } from '@levity/domain';
import type { Notification, NotificationRepository } from '@levity/persistence';

export class NotificationsService {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async getNotifications(
    userId: string,
    query: QueryNotificationsInput,
  ): Promise<PaginatedResponse<NotificationResponse>> {
    const { data, total } = await this.notificationRepository.findForUser(userId, query);
    return {
      items: data.map(toNotificationResponse),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
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
