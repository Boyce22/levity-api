import { Entity, Column, ManyToOne, OneToMany, PrimaryColumn, JoinColumn } from 'typeorm';
import { generateUUID } from '@levity/observability';
import type { SprintStatus, SprintTrackingMode } from '@levity/domain';
import { Workspace } from './workspace.entity';
import { SprintCard } from './sprint-card.entity';

@Entity('sprints')
export class Sprint {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'uuid' })
  workspace_id!: string;

  @Column()
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  goal?: string | null;

  @Column({ type: 'date' })
  start_date!: string;

  @Column({ type: 'date' })
  end_date!: string;

  @Column({ type: 'enum', enum: ['planning', 'active', 'completed'], enumName: 'sprint_status_enum', default: 'planning' })
  status!: SprintStatus;

  @Column({ type: 'enum', enum: ['points', 'count', 'hours'], enumName: 'sprint_tracking_mode_enum', default: 'points' })
  tracking_mode!: SprintTrackingMode;

  @Column({ type: 'float', nullable: true })
  capacity_points?: number | null;

  @Column({ type: 'float', nullable: true })
  velocity_points?: number;

  @Column({ type: 'uuid' })
  created_by!: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace!: Workspace;

  @OneToMany(() => SprintCard, (sc) => sc.sprint)
  sprint_cards!: SprintCard[];
}
