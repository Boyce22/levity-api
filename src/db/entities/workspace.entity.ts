import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryColumn, OneToMany } from 'typeorm';
import { generateUUID } from '../../shared/index';
import { WorkspaceStatus } from '../../contracts/index';
import { WorkspaceMember } from './workspace-member.entity';
import { WorkspaceInvite } from './workspace-invite.entity';
import { WorkspaceTag } from './workspace-tag.entity';
import { WorkspacePriority } from './workspace-priority.entity';
import { Board } from './board.entity';

@Entity('workspaces')
export class Workspace {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'varchar' })
  name!: string;

  @Column({
    type: 'enum',
    enum: WorkspaceStatus,
    enumName: 'workspace_status_enum',
    default: WorkspaceStatus.ACTIVE,
  })
  status!: WorkspaceStatus;

  @Column({ type: 'uuid' })
  created_by!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null;

  @OneToMany(() => WorkspaceMember, (m) => m.workspace)
  members!: WorkspaceMember[];

  @OneToMany(() => WorkspaceInvite, (i) => i.workspace)
  invites!: WorkspaceInvite[];

  @OneToMany(() => WorkspaceTag, (t) => t.workspace)
  tags!: WorkspaceTag[];

  @OneToMany(() => WorkspacePriority, (p) => p.workspace)
  priorities!: WorkspacePriority[];

  @OneToMany(() => Board, (b) => b.workspace)
  boards!: Board[];
}
