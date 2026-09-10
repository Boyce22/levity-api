import type { Logger } from 'pino';
import {
  NotificationType,
  type CreateCommentInput,
  type QueryCommentsInput,
  type UpdateCommentInput,
  type CommentResponse,
} from '../../contracts/index';
import { NotFoundError } from '../../shared/index';
import {
  IssueComment,
  Notification,
  IssueCommentRepository,
  NotificationRepository,
  type BoardColumnRepository,
  type BoardMemberRepository,
  type IssueRepository,
  type TransactionManager,
} from '../../db/index';

const MENTION_REGEX = /@(\w+)/g;

export class CommentsService {
  constructor(
    private readonly commentRepository: IssueCommentRepository,
    private readonly issueRepository: IssueRepository,
    private readonly boardColumnRepository: BoardColumnRepository,
    private readonly boardMemberRepository: BoardMemberRepository,
    private readonly transactionManager: TransactionManager,
    private readonly logger: Logger,
  ) {}

  async getReplies(userId: string, parentId: string): Promise<CommentResponse[]> {
    const parent = await this.commentRepository.findById(parentId);
    if (!parent) throw new NotFoundError('Comment not found');

    await this.assertIssueBoardMember(userId, parent.issue_id);

    const replies = await this.commentRepository.findByParent(parentId);
    return replies.map(toCommentResponse);
  }

  async getComments(
    userId: string,
    query: QueryCommentsInput,
  ): Promise<{ data: CommentResponse[]; nextCursor?: string }> {
    await this.assertIssueBoardMember(userId, query.issue_id);

    const { data, nextCursor } = await this.commentRepository.findByIssue(query);
    return { data: data.map(toCommentResponse), nextCursor };
  }

  async create(userId: string, input: CreateCommentInput): Promise<CommentResponse> {
    await this.assertIssueBoardMember(userId, input.issue_id);

    const comment = await this.transactionManager.runInTransaction(async (manager) => {
      const commentRepository = new IssueCommentRepository(manager.getRepository(IssueComment));
      const notificationRepository = new NotificationRepository(manager.getRepository(Notification));
      const createdComment = await commentRepository.create(userId, input);

      const mentions = [...input.content.matchAll(MENTION_REGEX)].map((m) => m[1]);
      if (mentions.length) {
        await this.notifyMentions(userId, input.issue_id, createdComment.id, mentions);
      }

      if (input.parent_id) {
        const parent = await commentRepository.findById(input.parent_id);
        if (parent && parent.created_by !== userId) {
          await notificationRepository.createMany([
            {
              user_id: parent.created_by,
              actor_id: userId,
              issue_id: input.issue_id,
              type: NotificationType.REPLY,
            },
          ]);
        }
      }

      return createdComment;
    });

    this.logger.info({ commentId: comment.id, issueId: input.issue_id }, 'Comment created');
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

  private async assertIssueBoardMember(userId: string, issueId: string): Promise<void> {
    const issue = await this.issueRepository.findByIdOrFail(issueId);
    const column = await this.boardColumnRepository.findByIdOrFail(issue.column_id);
    await this.boardMemberRepository.assertMember(userId, column.board_id);
  }

  private async notifyMentions(
    actorId: string,
    issueId: string,
    _commentId: string,
    usernames: string[],
  ): Promise<void> {
    this.logger.info({ actorId, issueId, mentions: usernames }, 'Mentions detected — wire up UserRepository to resolve');
  }
}

function toCommentResponse(comment: IssueComment): CommentResponse {
  return {
    id: comment.id,
    issue_id: comment.issue_id,
    created_by: comment.created_by,
    parent_id: comment.parent_id,
    content: comment.content,
    created_at: comment.created_at.toISOString(),
  };
}
