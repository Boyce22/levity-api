import { Entity, Column, ManyToOne, PrimaryColumn, JoinColumn } from 'typeorm';
import { generateUUID } from '../../shared/index';
import { BoardRole } from '../../contracts/index';
import { WorkspaceInvite } from './workspace-invite.entity';
import { Board } from './board.entity';

@Entity('invite_board_grants')
export class InviteBoardGrant {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'uuid' })
  invite_id!: string;

  @Column({ type: 'uuid' })
  board_id!: string;

  @Column({ type: 'enum', enum: BoardRole, enumName: 'board_role_enum' })
  board_role!: BoardRole;

  @ManyToOne(() => WorkspaceInvite, (i) => i.grants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invite_id' })
  invite!: WorkspaceInvite;

  @ManyToOne(() => Board, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'board_id' })
  board!: Board;
}
