import { Entity, Column, ManyToOne, CreateDateColumn, PrimaryColumn, JoinColumn } from 'typeorm';
import { generateUUID } from '../../shared/index';
import { MembershipStatus, WorkspaceRole } from '../../contracts/index';
import { User } from './user.entity';
import { Workspace } from './workspace.entity';

@Entity('workspace_members')
export class WorkspaceMember {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'uuid' })
  workspace_id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({
    type: 'enum',
    enum: WorkspaceRole,
    enumName: 'workspace_role_enum',
    default: WorkspaceRole.MEMBER,
  })
  role!: WorkspaceRole;

  @Column({
    type: 'enum',
    enum: MembershipStatus,
    enumName: 'membership_status_enum',
    default: MembershipStatus.ACTIVE,
  })
  membership_status!: MembershipStatus;

  @Column({ type: 'varchar', nullable: true })
  avatar_url?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  joined_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  left_at?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  last_accessed_at?: Date | null;

  @ManyToOne(() => Workspace, (w) => w.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
