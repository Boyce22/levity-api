import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  CreateDateColumn,
  PrimaryColumn,
  JoinColumn,
} from 'typeorm';
import { generateUUID } from '../../shared/index';
import { User } from './user.entity';
import { BoardColumn } from './board-column.entity';
import { IssueEvent } from './issue-event.entity';
import { IssueComment } from './issue-comment.entity';
import { IssueDiagram } from './issue-diagram.entity';
import { WorkspacePriority } from './workspace-priority.entity';
import { WorkspaceTag } from './workspace-tag.entity';

export type IssueWithCount = Issue & { comment_count: number };

@Entity('issues')
export class Issue {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'varchar' })
  content!: string;

  @Column({ type: 'float', default: 0 })
  position!: number;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', nullable: true })
  cover_url?: string | null;

  @Column({ type: 'uuid', nullable: true })
  assignee_id?: string | null;

  @Column({ type: 'uuid' })
  priority_id!: string;

  @Column({ type: 'uuid', nullable: true })
  tag_id?: string | null;

  @Column({ type: 'int', nullable: true })
  progress?: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  due_date?: Date | null;

  @Column({ type: 'uuid' })
  column_id!: string;

  @Column({ type: 'uuid' })
  created_by!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @Column({ type: 'int', nullable: true })
  story_points?: number | null;

  @Column({ type: 'float', nullable: true })
  estimated_hours?: number | null;

  @ManyToOne(() => BoardColumn, (column) => column.issues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'column_id' })
  column!: BoardColumn;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignee_id' })
  assignee?: User | null;

  @ManyToOne(() => WorkspacePriority, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'priority_id' })
  priority!: WorkspacePriority;

  @ManyToOne(() => WorkspaceTag, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tag_id' })
  tag?: WorkspaceTag | null;

  @OneToMany(() => IssueEvent, (e) => e.issue)
  events!: IssueEvent[];

  @OneToMany(() => IssueComment, (c) => c.issue)
  comments!: IssueComment[];

  @OneToOne(() => IssueDiagram, (d) => d.issue)
  diagram?: IssueDiagram;
}
