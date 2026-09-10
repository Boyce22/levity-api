import { Entity, Column, ManyToOne, PrimaryColumn, JoinColumn } from 'typeorm';
import { generateUUID } from '../../shared/index';
import { Issue } from './issue.entity';
import { Sprint } from './sprint.entity';

@Entity('sprint_issues')
export class SprintIssue {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'uuid' })
  sprint_id!: string;

  @Column({ type: 'uuid' })
  issue_id!: string;

  @Column({ type: 'int', default: 0 })
  position!: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  added_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  removed_at?: Date | null;

  @Column({ type: 'uuid', nullable: true })
  moved_to_sprint_id?: string | null;

  @ManyToOne(() => Sprint, (s) => s.sprint_issues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sprint_id' })
  sprint!: Sprint;

  @ManyToOne(() => Issue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issue_id' })
  issue!: Issue;

  @ManyToOne(() => Sprint, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'moved_to_sprint_id' })
  moved_to_sprint?: Sprint | null;
}
