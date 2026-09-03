import { Entity, Column, ManyToOne, CreateDateColumn, PrimaryColumn, Unique, JoinColumn } from 'typeorm';
import { generateUUID } from '../../observability/index';
import { Workspace } from './workspace.entity';

@Entity('workspace_priorities')
@Unique(['workspace_id', 'name'])
export class WorkspacePriority {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'uuid' })
  workspace_id!: string;

  @Column()
  name!: string;

  @Column()
  color!: string;

  @Column()
  icon!: string;

  @Column({ type: 'int', default: 0 })
  position!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @ManyToOne(() => Workspace, (w) => w.priorities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace!: Workspace;
}
