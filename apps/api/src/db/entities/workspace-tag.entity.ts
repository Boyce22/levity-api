import { Entity, Column, ManyToOne, CreateDateColumn, PrimaryColumn, Unique, JoinColumn } from 'typeorm';
import { generateUUID } from '../../observability/index';
import { Workspace } from './workspace.entity';

@Entity('workspace_tags')
@Unique(['workspace_id', 'name'])
export class WorkspaceTag {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'uuid' })
  workspace_id!: string;

  @Column()
  name!: string;

  @Column()
  color!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @ManyToOne(() => Workspace, (w) => w.tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace!: Workspace;
}
