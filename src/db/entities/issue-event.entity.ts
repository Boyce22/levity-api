import { Entity, Column, ManyToOne, CreateDateColumn, PrimaryColumn, JoinColumn } from 'typeorm';
import { generateUUID } from '../../shared/index';
import { Issue } from './issue.entity';

@Entity('issue_events')
export class IssueEvent {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'uuid' })
  issue_id!: string;

  @Column({ type: 'uuid' })
  created_by!: string;

  @Column({ type: 'varchar' })
  action_type!: string;

  @Column({ type: 'varchar' })
  field!: string;

  @Column({ type: 'varchar', nullable: true })
  old_val?: string | null;

  @Column({ type: 'varchar', nullable: true })
  new_val?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @ManyToOne(() => Issue, (issue) => issue.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issue_id' })
  issue!: Issue;
}
