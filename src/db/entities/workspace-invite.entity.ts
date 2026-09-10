import { Entity, Column, ManyToOne, OneToMany, CreateDateColumn, PrimaryColumn, JoinColumn } from 'typeorm';
import { generateUUID } from '../../shared/index';
import { WorkspaceRole } from '../../contracts/index';
import { Workspace } from './workspace.entity';
import { InviteBoardGrant } from './invite-board-grant.entity';

@Entity('workspace_invites')
export class WorkspaceInvite {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'uuid' })
  workspace_id!: string;

  @Column({ type: 'uuid', unique: true, default: () => 'gen_random_uuid()' })
  token!: string;

  @Column({ type: 'uuid' })
  created_by!: string;

  @Column({ type: 'int', default: 1 })
  max_uses!: number;

  @Column({ type: 'int', default: 0 })
  current_uses!: number;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  revoked_at?: Date | null;

  @Column({
    type: 'enum',
    enum: WorkspaceRole,
    enumName: 'workspace_role_enum',
    default: WorkspaceRole.MEMBER,
  })
  workspace_role!: WorkspaceRole;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @ManyToOne(() => Workspace, (w) => w.invites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace!: Workspace;

  @OneToMany(() => InviteBoardGrant, (g) => g.invite)
  grants!: InviteBoardGrant[];
}
