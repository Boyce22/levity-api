import { Entity, Column, ManyToOne, CreateDateColumn, PrimaryColumn, JoinColumn } from 'typeorm';
import { generateUUID } from '@levity/observability';
import { Role } from '@levity/domain';
import { Workspace } from './workspace.entity';

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
  expires_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revoked_at?: Date;

  @Column({ type: 'enum', enum: Role, default: Role.MEMBER })
  role!: Role;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @ManyToOne(() => Workspace, (w) => w.invites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace!: Workspace;
}
