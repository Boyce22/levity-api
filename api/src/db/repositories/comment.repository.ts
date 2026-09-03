import type { Repository } from 'typeorm';
import type { CreateCommentInput, QueryCommentsInput } from '../../contracts/index';
import { NotFoundError, ForbiddenError } from '../../shared/index';
import { type Comment } from '../entities/comment.entity';

export class CommentRepository {
  constructor(private readonly repository: Repository<Comment>) {}

  async findById(id: string): Promise<Comment | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByParent(parentId: string): Promise<Comment[]> {
    return this.repository.find({
      where: { parent_id: parentId },
      order: { created_at: 'ASC' },
    });
  }

  async findByCard(query: QueryCommentsInput): Promise<{ data: Comment[]; nextCursor?: string }> {
    const { card_id, limit, cursor } = query;

    const qb = this.repository
      .createQueryBuilder('comment')
      .where('comment.card_id = :card_id', { card_id })
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

  async create(userId: string, input: CreateCommentInput): Promise<Comment> {
    const comment = this.repository.create({ ...input, created_by: userId });
    return this.repository.save(comment);
  }

  async update(id: string, userId: string, content: string): Promise<Comment> {
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

  private async findByIdOrFail(id: string): Promise<Comment> {
    const comment = await this.findById(id);
    if (!comment) throw new NotFoundError('Comment not found');
    return comment;
  }
}
