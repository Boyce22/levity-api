import { Entity, Column, ManyToOne, CreateDateColumn, PrimaryColumn, JoinColumn } from 'typeorm';
import { generateUUID } from '../../shared/index';
import { BoardRole, MembershipStatus } from '../../contracts/index';
import { User } from './user.entity';
import { Board } from './board.entity';

@Entity('board_members')
export class BoardMember {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'uuid' })
  board_id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({
    type: 'enum',
    enum: BoardRole,
    enumName: 'board_role_enum',
    default: BoardRole.EDITOR,
  })
  role!: BoardRole;

  @Column({
    type: 'enum',
    enum: MembershipStatus,
    enumName: 'membership_status_enum',
    default: MembershipStatus.ACTIVE,
  })
  membership_status!: MembershipStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  joined_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  left_at?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  last_accessed_at?: Date | null;

  @ManyToOne(() => Board, (b) => b.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'board_id' })
  board!: Board;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
