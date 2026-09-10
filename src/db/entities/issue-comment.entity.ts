import { Entity, Column, ManyToOne, OneToMany, CreateDateColumn, PrimaryColumn, JoinColumn } from 'typeorm';
import { generateUUID } from '../../shared/index';
import { Issue } from './issue.entity';

@Entity('issue_comments')
export class IssueComment {
  @PrimaryColumn('uuid')
  id: string = generateUUID();

  @Column({ type: 'uuid' })
  issue_id!: string;

  @Column({ type: 'uuid', nullable: true })
  parent_id?: string | null;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'uuid' })
  created_by!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @ManyToOne(() => Issue, (issue) => issue.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issue_id' })
  issue!: Issue;

  @ManyToOne(() => IssueComment, (c) => c.replies, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent?: IssueComment | null;

  @OneToMany(() => IssueComment, (c) => c.parent)
  replies!: IssueComment[];
}
