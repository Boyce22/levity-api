import { Entity, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, PrimaryColumn, JoinColumn } from 'typeorm';
import { generateUUID } from '../../shared/index';
import { CatalogStatus } from '../../contracts/index';
import { Workspace } from './workspace.entity';

@Entity('workspace_tags')
export class WorkspaceTag {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'uuid' })
  workspace_id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  color!: string;

  @Column({
    type: 'enum',
    enum: CatalogStatus,
    enumName: 'catalog_status_enum',
    default: CatalogStatus.ACTIVE,
  })
  status!: CatalogStatus;

  @Column({ type: 'uuid', nullable: true })
  created_by?: string | null;

  @Column({ type: 'uuid', nullable: true })
  updated_by?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null;

  @ManyToOne(() => Workspace, (w) => w.tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace!: Workspace;
}
