import { Entity, Column, ManyToOne, OneToMany, PrimaryColumn, JoinColumn } from 'typeorm';
import { generateUUID } from '../../shared/index';
import type { SprintStatus, SprintTrackingMode } from '../../contracts/index';
import { Board } from './board.entity';
import { SprintIssue } from './sprint-issue.entity';

@Entity('sprints')
export class Sprint {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'uuid' })
  board_id!: string;

  @Column({ type: 'varchar' })
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
  velocity_points?: number | null;

  @Column({ type: 'uuid' })
  created_by!: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @ManyToOne(() => Board, (b) => b.sprints, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'board_id' })
  board!: Board;

  @OneToMany(() => SprintIssue, (si) => si.sprint)
  sprint_issues!: SprintIssue[];
}
