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
  type UserRepository,
} from '../../db/index';

const MENTION_REGEX = /@(\w+)/g;

export class CommentsService {
  constructor(
    private readonly commentRepository: IssueCommentRepository,
    private readonly issueRepository: IssueRepository,
    private readonly boardColumnRepository: BoardColumnRepository,
    private readonly boardMemberRepository: BoardMemberRepository,
    private readonly userRepository: UserRepository,
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
    const boardId = await this.assertIssueBoardWrite(userId, input.issue_id);

    const comment = await this.transactionManager.runInTransaction(async (manager) => {
      const commentRepository = new IssueCommentRepository(manager.getRepository(IssueComment));
      const notificationRepository = new NotificationRepository(manager.getRepository(Notification));
      const createdComment = await commentRepository.create(userId, input);

      const mentions = [...input.content.matchAll(MENTION_REGEX)].map((match) => match[1]);
      await this.notifyMentions(userId, input.issue_id, boardId, mentions, notificationRepository);

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
    const existing = await this.commentRepository.findById(commentId);
    if (!existing) throw new NotFoundError('Comment not found');
    await this.assertIssueBoardWrite(userId, existing.issue_id);
    const comment = await this.commentRepository.update(commentId, userId, input.content);
    return toCommentResponse(comment);
  }

  async delete(userId: string, commentId: string): Promise<void> {
    const existing = await this.commentRepository.findById(commentId);
    if (!existing) throw new NotFoundError('Comment not found');
    await this.assertIssueBoardWrite(userId, existing.issue_id);
    await this.commentRepository.delete(commentId, userId);
    this.logger.info({ commentId, userId }, 'Comment deleted');
  }

  private async assertIssueBoardMember(userId: string, issueId: string): Promise<string> {
    const issue = await this.issueRepository.findByIdOrFail(issueId);
    const column = await this.boardColumnRepository.findByIdOrFail(issue.column_id);
    await this.boardMemberRepository.assertMember(userId, column.board_id);
    return column.board_id;
  }

  private async assertIssueBoardWrite(userId: string, issueId: string): Promise<string> {
    const issue = await this.issueRepository.findByIdOrFail(issueId);
    const column = await this.boardColumnRepository.findByIdOrFail(issue.column_id);
    await this.boardMemberRepository.assertWrite(userId, column.board_id);
    return column.board_id;
  }

  private async notifyMentions(
    actorId: string,
    issueId: string,
    boardId: string,
    usernames: string[],
    notificationRepository: NotificationRepository,
  ): Promise<void> {
    const unique = [...new Set(usernames)];
    if (!unique.length) return;

    const users = await this.userRepository.findLiveByUsernames(unique);
    const candidates = users.filter((user) => user.id !== actorId);
    const allowed = await this.boardMemberRepository.findActiveUserIds(
      boardId,
      candidates.map((user) => user.id),
    );
    const payloads = candidates
      .filter((user) => allowed.has(user.id))
      .map((user) => ({
        user_id: user.id,
        actor_id: actorId,
        issue_id: issueId,
        type: NotificationType.MENTION,
      }));
    if (payloads.length) await notificationRepository.createMany(payloads);
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
