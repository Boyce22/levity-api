import { In, type Repository } from 'typeorm';
import { BoardRole, MembershipStatus, canWriteBoard } from '../../contracts/index';
import { ForbiddenError } from '../../shared/index';
import { type BoardMember } from '../entities/board-member.entity';

export class BoardMemberRepository {
  constructor(private readonly repository: Repository<BoardMember>) {}

  async findActiveByUser(userId: string): Promise<BoardMember[]> {
    return this.repository
      .createQueryBuilder('bm')
      .innerJoinAndSelect('bm.board', 'board')
      .where('bm.user_id = :userId', { userId })
      .andWhere('bm.membership_status = :status', { status: MembershipStatus.ACTIVE })
      .andWhere('board.deleted_at IS NULL')
      .orderBy('board.position', 'ASC')
      .getMany();
  }

  async findByBoardAndUser(boardId: string, userId: string): Promise<BoardMember | null> {
    const active = await this.repository.findOne({
      where: { board_id: boardId, user_id: userId, membership_status: MembershipStatus.ACTIVE },
    });
    if (active) return active;
    return this.repository.findOne({ where: { board_id: boardId, user_id: userId } });
  }

  async findActiveUserIds(boardId: string, userIds: string[]): Promise<Set<string>> {
    const unique = [...new Set(userIds)];
    if (!unique.length) return new Set();
    const rows = await this.repository.find({
      where: { board_id: boardId, user_id: In(unique), membership_status: MembershipStatus.ACTIVE },
      select: ['user_id'],
    });
    return new Set(rows.map((row) => row.user_id));
  }

  async assertMember(userId: string, boardId: string): Promise<BoardMember> {
    const member = await this.repository
      .createQueryBuilder('bm')
      .innerJoin('boards', 'board', 'board.id = bm.board_id')
      .innerJoin('workspaces', 'workspace', 'workspace.id = board.workspace_id')
      .where('bm.user_id = :userId', { userId })
      .andWhere('bm.board_id = :boardId', { boardId })
      .andWhere('bm.membership_status = :status', { status: MembershipStatus.ACTIVE })
      .andWhere('board.deleted_at IS NULL')
      .andWhere('workspace.deleted_at IS NULL')
      .getOne();
    if (!member) throw new ForbiddenError('Not a member of this board');
    return member;
  }

  async assertWrite(userId: string, boardId: string): Promise<BoardMember> {
    const member = await this.assertMember(userId, boardId);
    if (!canWriteBoard(member.role)) throw new ForbiddenError('Insufficient permissions');
    return member;
  }

  async add(boardId: string, userId: string, role: BoardRole = BoardRole.EDITOR): Promise<BoardMember> {
    const member = this.repository.create({
      board_id: boardId,
      user_id: userId,
      role,
      membership_status: MembershipStatus.ACTIVE,
    });
    return this.repository.save(member);
  }

  async upsertActive(boardId: string, userId: string, role: BoardRole): Promise<BoardMember> {
    const existing = await this.repository.findOne({ where: { board_id: boardId, user_id: userId } });
    if (existing) {
      existing.role = role;
      existing.membership_status = MembershipStatus.ACTIVE;
      existing.left_at = null;
      return this.repository.save(existing);
    }
    return this.add(boardId, userId, role);
  }

  async touchLastAccessed(boardId: string, userId: string): Promise<void> {
    await this.repository.update({ board_id: boardId, user_id: userId }, { last_accessed_at: new Date() });
  }
}
