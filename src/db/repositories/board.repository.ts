import { IsNull, type Repository } from 'typeorm';
import { NotFoundError } from '../../shared/index';
import { type Board } from '../entities/board.entity';

export type CreateBoardData = {
  workspace_id: string;
  name: string;
  created_by: string;
  position?: number;
};

export class BoardRepository {
  constructor(private readonly repository: Repository<Board>) {}

  async findById(id: string): Promise<Board | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<Board> {
    const board = await this.findById(id);
    if (!board) throw new NotFoundError('Board not found');
    return board;
  }

  async findByWorkspace(workspaceId: string): Promise<Board[]> {
    return this.repository.find({
      where: { workspace_id: workspaceId, deleted_at: IsNull() },
      order: { position: 'ASC' },
    });
  }

  async create(data: CreateBoardData): Promise<Board> {
    const board = this.repository.create(data);
    return this.repository.save(board);
  }

  async rename(id: string, name: string): Promise<Board> {
    const board = await this.findByIdOrFail(id);
    board.name = name;
    return this.repository.save(board);
  }
}
