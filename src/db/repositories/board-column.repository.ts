import type { Repository } from 'typeorm';
import type { BoardColumnType } from '../../contracts/index';
import { NotFoundError } from '../../shared/index';
import { type BoardColumn } from '../entities/board-column.entity';
import type { IssueWithCount } from '../entities/issue.entity';

export type CreateBoardColumnInput = {
  board_id: string;
  title: string;
  position?: number;
  wip_limit?: number | null;
  column_type?: BoardColumnType | null;
};

export type UpdateBoardColumnInput = Partial<Pick<BoardColumn, 'title' | 'position' | 'wip_limit' | 'column_type'>>;

export type UpdateBoardColumnPositionsInput = { id: string; position: number }[];

export class BoardColumnRepository {
  constructor(private readonly repository: Repository<BoardColumn>) {}

  async findById(id: string): Promise<BoardColumn | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<BoardColumn> {
    const column = await this.findById(id);
    if (!column) throw new NotFoundError('Column not found');
    return column;
  }

  async findByBoard(boardId: string): Promise<BoardColumn[]> {
    const qb = this.repository
      .createQueryBuilder('col')
      .leftJoinAndSelect('col.issues', 'issue')
      .where('col.board_id = :boardId', { boardId })
      .orderBy('col.position', 'ASC')
      .addOrderBy('issue.position', 'ASC')
      .addSelect(
        (sq) => sq.select('COUNT(*)').from('issue_comments', 'c').where('c.issue_id = issue.id'),
        'issue__comment_count',
      );

    const results = await qb.getRawAndEntities();

    const map: Record<string, number> = {};
    for (const raw of results.raw) {
      if (raw.issue__comment_count !== null && raw.issue_id) {
        map[raw.issue_id] = Number(raw.issue__comment_count);
      }
    }

    for (const column of results.entities) {
      for (const issue of column.issues ?? []) {
        (issue as IssueWithCount).comment_count = map[issue.id] ?? 0;
      }
    }

    return results.entities;
  }

  async create(userId: string, input: CreateBoardColumnInput): Promise<BoardColumn> {
    const column = this.repository.create({ ...input, created_by: userId });
    return this.repository.save(column);
  }

  async update(id: string, input: UpdateBoardColumnInput): Promise<BoardColumn> {
    const column = await this.findByIdOrFail(id);
    Object.assign(column, input);
    return this.repository.save(column);
  }

  async updatePositions(updates: UpdateBoardColumnPositionsInput): Promise<void> {
    if (!updates.length) return;
    const ids = updates.map((u) => u.id);
    const positions = updates.map((u) => u.position);
    await this.repository.query(
      `UPDATE board_columns AS c
       SET position = d.position::float8
       FROM (
         SELECT unnest($1::uuid[])   AS id,
                unnest($2::float8[]) AS position
       ) AS d
       WHERE c.id = d.id`,
      [ids, positions],
    );
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (!result.affected) throw new NotFoundError('Column not found');
  }
}
