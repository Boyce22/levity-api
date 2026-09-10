import type { Repository } from 'typeorm';
import { NotFoundError, ForbiddenError } from '../../shared/index';
import { type IssueComment } from '../entities/issue-comment.entity';

export type CreateIssueCommentData = {
  issue_id: string;
  content: string;
  parent_id?: string | null;
};

export type QueryIssueCommentsInput = {
  issue_id: string;
  limit: number;
  cursor?: string;
};

export class IssueCommentRepository {
  constructor(private readonly repository: Repository<IssueComment>) {}

  async findById(id: string): Promise<IssueComment | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByParent(parentId: string): Promise<IssueComment[]> {
    return this.repository.find({
      where: { parent_id: parentId },
      order: { created_at: 'ASC' },
    });
  }

  async findByIssue(query: QueryIssueCommentsInput): Promise<{ data: IssueComment[]; nextCursor?: string }> {
    const { issue_id, limit, cursor } = query;

    const qb = this.repository
      .createQueryBuilder('comment')
      .where('comment.issue_id = :issue_id', { issue_id })
      .orderBy('comment.created_at', 'DESC')
      .take(limit + 1);

    if (cursor) {
      qb.andWhere('comment.created_at < :cursor', { cursor: new Date(cursor) });
    }

    const results = await qb.getMany();
    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;
    const nextCursor = hasMore ? data[data.length - 1].created_at.toISOString() : undefined;

    return { data, nextCursor };
  }

  async create(userId: string, input: CreateIssueCommentData): Promise<IssueComment> {
    const comment = this.repository.create({ ...input, created_by: userId });
    return this.repository.save(comment);
  }

  async update(id: string, userId: string, content: string): Promise<IssueComment> {
    const comment = await this.findByIdOrFail(id);
    if (comment.created_by !== userId) throw new ForbiddenError("Cannot edit another user's comment");
    comment.content = content;
    return this.repository.save(comment);
  }

  async delete(id: string, userId: string, isPrivileged = false): Promise<void> {
    const comment = await this.findByIdOrFail(id);
    if (comment.created_by !== userId && !isPrivileged) {
      throw new ForbiddenError("Cannot delete another user's comment");
    }
    await this.repository.delete(id);
  }

  private async findByIdOrFail(id: string): Promise<IssueComment> {
    const comment = await this.findById(id);
    if (!comment) throw new NotFoundError('Comment not found');
    return comment;
  }
}
