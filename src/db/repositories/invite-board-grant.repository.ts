import type { Repository } from 'typeorm';
import { type BoardRole } from '../../contracts/index';
import { type InviteBoardGrant } from '../entities/invite-board-grant.entity';

export class InviteBoardGrantRepository {
  constructor(private readonly repository: Repository<InviteBoardGrant>) {}

  async findByInvite(inviteId: string): Promise<InviteBoardGrant[]> {
    return this.repository.find({ where: { invite_id: inviteId } });
  }

  async createMany(
    inviteId: string,
    grants: { board_id: string; board_role: BoardRole }[],
  ): Promise<InviteBoardGrant[]> {
    if (!grants.length) return [];
    const entities = grants.map((g) =>
      this.repository.create({ invite_id: inviteId, board_id: g.board_id, board_role: g.board_role }),
    );
    return this.repository.save(entities);
  }
}
