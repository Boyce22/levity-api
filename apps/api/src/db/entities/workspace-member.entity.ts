import { Entity, Column, ManyToOne, CreateDateColumn, PrimaryColumn, Unique, JoinColumn } from 'typeorm';
import { generateUUID } from '../../observability/index';
import { Role } from '../../domain/index';
import { User } from './user.entity';
import { Workspace } from './workspace.entity';

@Entity('workspace_members')
@Unique(['workspace_id', 'user_id'])
export class WorkspaceMember {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'uuid' })
  workspace_id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'enum', enum: Role, default: Role.MEMBER })
  role!: Role;

  @CreateDateColumn({ type: 'timestamptz' })
  joined_at!: Date;

  @ManyToOne(() => Workspace, (w) => w.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
