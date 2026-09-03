import type { Logger } from 'pino';
import {
  NotificationType,
  type CreateCommentInput,
  type QueryCommentsInput,
  type UpdateCommentInput,
  type CommentResponse,
} from '../../domain/index';
import { NotFoundError } from '../../shared/index';
import {
  Comment,
  CommentRepository,
  Notification,
  NotificationRepository,
  type CardRepository,
  type ListRepository,
  type WorkspaceMemberRepository,
  type TransactionManager,
} from '../../db/index';

const MENTION_REGEX = /@(\w+)/g;

export class CommentsService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly cardRepository: CardRepository,
    private readonly listRepository: ListRepository,
    private readonly memberRepository: WorkspaceMemberRepository,
    private readonly transactionManager: TransactionManager,
    private readonly logger: Logger,
  ) {}

  async getReplies(userId: string, parentId: string): Promise<CommentResponse[]> {
    const parent = await this.commentRepository.findById(parentId);
    if (!parent) throw new NotFoundError('Comment not found');

    const card = await this.cardRepository.findByIdOrFail(parent.card_id);
    const list = await this.listRepository.findByIdOrFail(card.list_id);
    await this.memberRepository.assertMember(userId, list.workspace_id);

    const replies = await this.commentRepository.findByParent(parentId);
    return replies.map(toCommentResponse);
  }

  async getComments(
    userId: string,
    query: QueryCommentsInput,
  ): Promise<{ data: CommentResponse[]; nextCursor?: string }> {
    const card = await this.cardRepository.findByIdOrFail(query.card_id);
    const list = await this.listRepository.findByIdOrFail(card.list_id);
    await this.memberRepository.assertMember(userId, list.workspace_id);

    const { data, nextCursor } = await this.commentRepository.findByCard(query);
    return { data: data.map(toCommentResponse), nextCursor };
  }

  async create(userId: string, input: CreateCommentInput): Promise<CommentResponse> {
    const card = await this.cardRepository.findByIdOrFail(input.card_id);
    const list = await this.listRepository.findByIdOrFail(card.list_id);
    await this.memberRepository.assertMember(userId, list.workspace_id);

    const comment = await this.transactionManager.runInTransaction(async (manager) => {
      const commentRepository = new CommentRepository(manager.getRepository(Comment));
      const notificationRepository = new NotificationRepository(manager.getRepository(Notification));
      const createdComment = await commentRepository.create(userId, input);

      const mentions = [...input.content.matchAll(MENTION_REGEX)].map((m) => m[1]);
      if (mentions.length) {
        await this.notifyMentions(userId, card.id, createdComment.id, mentions, input.content, list.workspace_id);
      }

      if (input.parent_id) {
        const parent = await commentRepository.findById(input.parent_id);
        if (parent && parent.created_by !== userId) {
          await notificationRepository.createMany([
            {
              user_id: parent.created_by,
              actor_id: userId,
              card_id: card.id,
              type: NotificationType.REPLY,
              content: input.content.slice(0, 100),
            },
          ]);
        }
      }

      return createdComment;
    });

    this.logger.info({ commentId: comment.id, cardId: card.id }, 'Comment created');
    return toCommentResponse(comment);
  }

  async update(userId: string, commentId: string, input: UpdateCommentInput): Promise<CommentResponse> {
    const comment = await this.commentRepository.update(commentId, userId, input.content);
    return toCommentResponse(comment);
  }

  async delete(userId: string, commentId: string): Promise<void> {
    await this.commentRepository.delete(commentId, userId);
    this.logger.info({ commentId, userId }, 'Comment deleted');
  }

  private async notifyMentions(
    actorId: string,
    cardId: string,
    _commentId: string,
    usernames: string[],
    _content: string,
    _workspaceId: string,
  ): Promise<void> {
    this.logger.info({ actorId, cardId, mentions: usernames }, 'Mentions detected — wire up UserRepository to resolve');
  }
}

function toCommentResponse(comment: Comment): CommentResponse {
  return {
    id: comment.id,
    card_id: comment.card_id,
    created_by: comment.created_by,
    parent_id: comment.parent_id,
    content: comment.content,
    created_at: comment.created_at.toISOString(),
  };
}
