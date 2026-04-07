import { UUID } from '@utils';
import { Role } from '@/shared/enums/roles.enum';
import { Entity, Column, ManyToOne, CreateDateColumn, PrimaryColumn, Unique, JoinColumn } from 'typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { Workspace } from './workspace.entity';

@Entity('workspace_members')
@Unique(['workspace_id', 'user_id'])
export class WorkspaceMember {
  @PrimaryColumn('uuid')
  id: string = UUID.generate();

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
